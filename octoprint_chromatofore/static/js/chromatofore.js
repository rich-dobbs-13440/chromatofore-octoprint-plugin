// octoprint_chromatofore/static/js/chromatofore.js

$(function() {

    

    function ChromatoforeViewModel(parameters) {

        var self = this;
        self.refreshRates = [
            { text: "Never", value: 100000 },
            { text: "Every Second", value: 1 },
            { text: "Every Other Second", value: 2 },
            { text: "Every 5 Seconds", value: 5 },
            { text: "Every 10 Seconds", value: 10 },
        ];
        self.selectedRefreshRateInSeconds = ko.observable(1); // Default to "Never".               
            

        self.settingsViewModel = parameters[0];

        
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
            // console.log("gpio_boards via self.settingsViewModel.settings.plugins.chromatofore.gpio_boards()", self.settingsViewModel.settings.plugins.chromatofore.gpio_boards());
            self.pluginSettings = parameters[0].settings.plugins.chromatofore;

            // For Actuators
            var actuatorData = ko.toJS(self.pluginSettings.actuators);
            self.actuators = ko.observableArray(actuatorData.map(function(data) {
                return new Actuator(data,  self.selectedRefreshRateInSeconds);
            }));
            console.log("self.actuators() :", self.actuators());               


            var gpioBoardData = ko.toJS(self.pluginSettings.gpio_boards);
            self.gpioBoards = new I2cBoards(gpioBoardData, 0x20);
            console.log("self.gpioBoards.toData()", self.gpioBoards.toData());
            console.log("GPIO Boards items:", ko.toJS(self.gpioBoards.boards));


            var servoBoardData = ko.toJS(self.pluginSettings.servo_driver_boards);
            self.servoBoards = new I2cBoards(servoBoardData, 0x40);
            console.log("self.servoBoards.toData()", self.servoBoards.toData());
            console.log("Servo Boards: items", ko.toJS(self.servoBoards.boards));         
        };    
        
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
        };


        self.validateI2cBoard = function(address) {
            // This should make an AJAX request to your plugin's backend to verify the address.
            console.log("address", address());
            OctoPrint.simpleApiCommand("chromatofore", "validate_i2c", { address: address() })
            .done(function(response) {
                console.log("Got response from simpleApiCommand");
                if (response.valid) {
                    alert('Address ' + address + ' is valid!');
                } else {
                    alert('Address ' + address + ' is not accessible!');
                }
            })
            .fail(function() {
                console.log("Got fail from simpleApiCommand");
            });
        }

        self.updateAddressFromInput = function(board) {
            var inputValue = board.addressInput();
            var intValue = parseInt(inputValue, 16);
            
            if (!isNaN(intValue) && intValue >= 0x00 && intValue <= 0x7F) {
                board.address(intValue);
                board.addressInput("0x" + intValue.toString(16).toUpperCase().padStart(2, '0'));  // this updates the input field with the formatted hex
            } else {
                // Handle invalid input, possibly reset to previous value or show an error
                //board.addressInput("0x" + board.address().toString(16).toUpperCase().padStart(2, '0'));
                board.addressInput("0x??");
            }
        };

    }

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore"]
    }); 


});

console.log("Exit chromatofore.js")


