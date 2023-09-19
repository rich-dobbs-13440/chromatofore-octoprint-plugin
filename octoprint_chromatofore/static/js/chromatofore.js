// octoprint_chromatofore/static/js/chromatofore.js

$(function() {



    class FilamentMoveModalDialog {
        constructor() {
            // Observables
            this.progressPercentage = ko.observable(0);
            this.title =  ko.observable("--title-placeholder--");
            this.step = ko.observable(0);
            this.nsteps = ko.observable("???");
            this.pusher_position = ko.observable(0);
            this.rate_in_mm_per_sec = ko.observable(0);
            this.servo_move_count = ko.observable(0);
            this.filament_sensed = ko.observable(false);
            this.pusher_limit_switch_is_triggered = ko.observable(false);            

            // Binding methods to the instance
            this.showModal = this.showModal.bind(this);
            this.hideModal = this.hideModal.bind(this);
            this.cancelTask = this.cancelTask.bind(this);   
            this.updateStatus = this.updateStatus.bind(this);   
            
            // Other initialization
            this.actuatorHashCode = undefined;
            this.updateStatus({}); // Show default values prior to receiving any update.  
        }

        showModal(actuatorHashCode) {
            console.log("FilamentMoveModalDialog.showModal called");
            if (typeof actuatorHashCode !== 'undefined') {
                // actuatorHashCode was provided
                this.actuatorHashCode = actuatorHashCode;
            }

            // Bind event listener for backdrop clicks
            this.backdropClickListener = function(e) {
                if (e.target !== e.currentTarget) return;
            };

            document.querySelector('#filamentMoveModal').addEventListener('click', this.backdropClickListener);
                        
            $('#filamentMoveModal').show();  

            const modalContentElement = $('#filamentMoveModal .modal-content');
            const id = `#actuator-${actuatorHashCode}`;
            const locationElement = $(id);
            if (locationElement.length) {             
                let position = locationElement.position();
                console.log("`${id}` found: position:", "top:", position.top, "left:", position.left);
                
                modalContentElement.css({
                    'top': position.top,
                    'left': position.left + 20
                });
            }         
        }
        
        

        hideModal() {
            console.log("FilamentMoveModalDialog.hideModal called");
            // Unbind event listener for backdrop clicks
            document.querySelector('#filamentMoveModal').removeEventListener('click', this.backdropClickListener);
            this.backdropClickListener = null;            
            $('#filamentMoveModal').hide();
        }

        cancelTask() {
            console.log("FilamentMoveModalDialog.cancelTask called");
            this.hideModal();
            actuator_command('cancel_filament_move', this.actuatorHashCode, {});

        }

        updateStatus(data) {
            console.log("FilamentMoveModalDialog.updateStatus called with", data);
    
            const {
                thread_task = "Unknown",
                nickname = "Unknown",
                step = -1,
                nsteps = 1,
                filament_sensed = false,
                pusher_position = 0,
                pusher_limit_switch_is_triggered = false,
                rate_in_mm_per_sec = 0,
                servo_move_count = 0
            } = data;
    
            const percentageProgress = (step + 1)*100/nsteps;
            console.log("percentageProgress: ", percentageProgress);
            
            this.progressPercentage(percentageProgress);
            this.title(`${thread_task} for Actuator: ${nickname}`); 
            this.step(step+1);  // Convert from zero based index to one based for display to user.
            this.nsteps(nsteps);
            this.pusher_position(pusher_position);
            this.rate_in_mm_per_sec(rate_in_mm_per_sec);
            this.servo_move_count(servo_move_count);
            this.filament_sensed(filament_sensed);
            this.pusher_limit_switch_is_triggered(pusher_limit_switch_is_triggered);
    
            if (data.completed) {
                this.hideModal()
            }
        }        
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
        self.filaments = new Filaments();
        self.filaments.fetch();
        


        
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

            console.log("self.filaments.sortedByDisplayName()", self.filaments.sortedByDisplayName());


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
            self.checkTaskRunning();

            var data = [
                {id: "--empty--", text: "Empty", color: "#444444"},
                {id: 1, text: "Sunlu PLA Black", color: "#000000"},
                {id: 2, text: "Sunlu PLA Shiny Gold", color: "#D4AF37"},
                {id: 3, text: "Sunlu PLA Shiny Copper", color: "#B87333"},
                {id: 4, text: "Cut-Rate PLA Red", color: "#FF0000"},
                {id: 5, text: "Sunlu PLA White", color: "#FFFFFF"}
            ];

            initializeFilamentDropdown("#select-filament-2", data);
            initializeFilamentDropdown(".select-filament-class", data);
            initializeFilamentDropdown(".select-filament-dropdown", data);
            


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
        

        self.checkTaskRunning = function() {
            OctoPrint.simpleApiCommand("chromatofore", "check_if_task_is_running")
            .done(function(response) {
                if (response.task_is_running) {
                    console.log("Task is running. Showing progress.");
                    self.filamentMoveModal.showModal();
                } else {
                    console.log("No task running.");
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Failed to check task status. Status:", textStatus, "Error:", errorThrown, "Response:", jqXHR.responseText);
            });
        }

        self.activateTab = function() {
            self.checkTaskRunning();
        }

        self.onTabChange = function(next, current) {
            if (next  == "#tab_plugin_chromatofore") {
                console.log("Tab will be shown now.");   
            }

        }
        
        self.onAfterTabChange = function(current, previous) {
            if (current  == "#tab_plugin_chromatofore") {
                console.log("Tab is selected. Activate it!");   
                self.checkTaskRunning()
            }
        } 
        
        self.goToChromatoforeSettings = function() {
            console.log("self.settingsViewModel:", self.settingsViewModel);
            //self.settingsViewModel.settingsDialog.
            //self.settingsViewModel.activeTab('plugin_chromatofore');
        };
        
    }
    

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore", "#tab_plugin_chromatofore"]
    }); 

});



console.log("Exit chromatofore.js")


