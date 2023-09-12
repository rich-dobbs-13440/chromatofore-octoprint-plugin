// octoprint_chromatofore/static/js/chromatofore.js

$(function() {



    class FilamentMoveModalDialog {
        constructor() {
            this.progressPercentage = ko.observable(0);
            this.actuatorHashCode = undefined;

            // Binding methods to the instance
            this.showModal = this.showModal.bind(this);
            this.hideModal = this.hideModal.bind(this);
            this.cancelTask = this.cancelTask.bind(this);   
            this.updateStatus = this.updateStatus.bind(this);            
        }

        showModal(actuatorHashCode) {
            console.log("FilamentMoveModalDialog.showModal called");
            this.progressPercentage(0);
            this.actuatorHashCode = actuatorHashCode;
            $('#filamentMoveModal').modal('show');
        }

        hideModal() {
            console.log("FilamentMoveModalDialog.hideModal called");
            $('#filamentMoveModal').modal('hide');
        }

        cancelTask() {
            console.log("FilamentMoveModalDialog.cancelTask called");
            this.hideModal();
            actuator_command('cancel_filament_move', this.actuatorHashCode, {});

        }

        updateStatus(data) {
            console.log("FilamentMoveModalDialog.updateStatus called with", data);

            // "step": self.step_index,
            // "nstep": self.nstep,
            // "filament_sensed": self.filament_sensor.is_filament_sensed(),
            // "pusher_position": self.pusher.position,
            // "pusher_limit_switch_is_triggered":  self.pusher_limit_switch.is_triggered()  

            const nsteps = "nsteps" in data ? data.nsteps : 1;
            const step = "step" in data ? data.step : 1; 
            const percentageProgress = (step + 1)*100/nsteps
            console.log("percentageProgress: ", percentageProgress);
            this.progressPercentage(percentageProgress); 
            const completed = "completed" in data ? data.completed : false;
            if (completed) {
                this.hideModal()
            }
        }

        // other methods...
    }


    function ChromatoforeViewModel(parameters) {
        console.log("In ChromatoforeViewModel");

        var self = this;
        self.refreshRates = [
            { text: "Never", value: 100000 },
            { text: "Every Second", value: 1 },
            { text: "Every Other Second", value: 2 },
            { text: "Every 5 Seconds", value: 5 },
            { text: "Every 10 Seconds", value: 10 },
        ];
        self.selectedRefreshRateInSeconds = ko.observable(1); // Default to "each second".               
        self.selectedScanRefreshRateInSeconds = ko.observable(30); // Default to "every 30 seconds.    
        
        console.log(parameters);

        self.settingsViewModel = parameters[0];

        self.isfilamentMoveRunning = ko.observable(false);
        self.filamentMoveModal = new FilamentMoveModalDialog();

        
        self.removeActuator = function(actuator) {
            // TODO: Show confirmation dialog
            self.actuators.remove(actuator);
        }  

        self.addActuator = function() {
            let lastActuator = self.actuators()[self.actuators().length - 1];
            let data = lastActuator ? lastActuator.getDataToBuildNextAcuator() : Actuator.defaultData;
            var actuator = new Actuator(data, self.selectedRefreshRateInSeconds);
            actuator.detailsVisible(true);
            self.actuators.push(actuator);
        }

        // This will get called before the ChromatoforeViewModel gets bound to the DOM, but after its
        // dependencies have already been initialized. It is especially guaranteed that this method
        // gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
        // the SettingsViewModel been properly populated.
        self.onBeforeBinding = function() {
            console.log("Inside onBeforeBinding");
            self.pluginSettings = parameters[0].settings.plugins.chromatofore;

            // For Actuators
            var actuatorData = ko.toJS(self.pluginSettings.actuators);
            self.actuators = ko.observableArray(actuatorData.map(function(data) {
                return new Actuator(data,  self.selectedRefreshRateInSeconds);
            }));
            console.log("self.actuators() :", self.actuators());               


            var gpioBoardData = ko.toJS(self.pluginSettings.gpio_boards);
            self.gpioBoards = new I2cBoards(gpioBoardData, 0x20, 8, self.selectedScanRefreshRateInSeconds);
            console.log("self.gpioBoards.toData()", self.gpioBoards.toData());
            console.log("GPIO Boards items:", ko.toJS(self.gpioBoards.boards));


            var servoBoardData = ko.toJS(self.pluginSettings.servo_driver_boards);
            self.servoBoards = new I2cBoards(servoBoardData, 0x40, 64, self.selectedScanRefreshRateInSeconds);
            console.log("self.servoBoards.toData()", self.servoBoards.toData());
            console.log("Servo Boards: items", ko.toJS(self.servoBoards.boards));         
        }; 
        
        self.onAfterBinding = function() {
            initializeI2cBoardBindings();
        }
        
        self.onSettingsBeforeSave = function() {
            console.log("Inside onSettingsBeforeSave");
            {
                var data = self.gpioBoards.toData();
                console.log("GPIO board data to save:", data);   
                // Update the original settings with the new values
                self.pluginSettings.gpio_boards(data);                       
            }
            {
                var data = self.servoBoards.toData();
                console.log("Servo board data to save:", data);   
                // Update the original settings with the new values
                self.pluginSettings.servo_driver_boards(data);                            
            }   
            {
                var data = self.actuators().map(function(actuator) {
                    return actuator.toData();
                });
                console.log("Actuators data to save:", data);
                // Update the original settings with the new values
                self.pluginSettings.actuators(data);
            }

            const reloadMillis = 2000;
            if (self.settingsWereSaved) {
                setTimeout(function() {
                    console.error("Reload in response to settingsWereSaved");
                    location.reload();
                }, reloadMillis);  
            }
        };

        self.loadFilament = function(actuatorHashCode, options) {
            actuator_command('load_filament', actuatorHashCode, options);
            // Disable controls as appropriate
            self.isfilamentMoveRunning(true);
            self.filamentMoveModal.showModal(actuatorHashCode);
        }

        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin !== "chromatofore") {
                return;
            }
            if (data.message_type == "status_update") {
                self.filamentMoveModal.updateStatus(data);  
            }
        }     
    }

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore", "#tab_plugin_chromatofore"]
    }); 
 


});



console.log("Exit chromatofore.js")


