// octoprint_chromatofore/static/js/chromatofore.js

$(function() {


    function GpioBoard(address) {
        var self = this;
        self.address = ko.observable(address);
        self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0')); 
    }

    function ServoBoard(address) {
        var self = this;
        self.address = ko.observable(address);
        self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0')); 
    }    

    function Actuator(data) {
        var self = this;
        
        // Base properties
        self.id = ko.observable(data.id);
    
        // Pusher properties
        self.pusher = {
            board: ko.observable(data.pusher.board),
            channel: ko.observable(data.pusher.channel),
            min_angle: ko.observable(data.pusher.min_angle),
            max_angle: ko.observable(data.pusher.max_angle)
        };
    
        // Moving clamp properties
        self.moving_clamp = {
            board: ko.observable(data.moving_clamp.board),
            channel: ko.observable(data.moving_clamp.channel),
            min_angle: ko.observable(data.moving_clamp.min_angle),
            max_angle: ko.observable(data.moving_clamp.max_angle)
        };
    
        // Fixed clamp properties
        self.fixed_clamp = {
            board: ko.observable(data.fixed_clamp.board),
            channel: ko.observable(data.fixed_clamp.channel),
            min_angle: ko.observable(data.fixed_clamp.min_angle),
            max_angle: ko.observable(data.fixed_clamp.max_angle)
        };
    
        // Pusher limit switch properties
        self.pusher_limit_switch = {
            board: ko.observable(data.pusher_limit_switch.board),
            channel: ko.observable(data.pusher_limit_switch.channel)
        };
    
        // Filament sensor properties
        self.filament_sensor = {
            board: ko.observable(data.filament_sensor.board),
            channel: ko.observable(data.filament_sensor.channel)
        };
    }
    
    

    function ChromatoforeViewModel(parameters) {

        var self = this;

        self.settingsViewModel = parameters[0];

        // Operations
        self.addGpioBoard = function() {
            self.gpioBoards.push(new GpioBoard(0x20));
            console.log("After adding gpio board: ", self.gpioBoards());
            console.log(self.gpioBoards());
        };

        self.removeGpioBoard = function(board) {
            self.gpioBoards.remove(board);
        };      
        
        self.addServoBoard = function() {
            self.servoBoards.push(new ServoBoard(0x80));
            console.log("After adding servo board: ", self.servoBoards());
            console.log(self.servoBoards());
        };

        self.removeServoBoard = function(board) {
            self.servoBoards.remove(board);
        };         

        // This will get called before the ChromatoforeViewModel gets bound to the DOM, but after its
        // dependencies have already been initialized. It is especially guaranteed that this method
        // gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
        // the SettingsViewModel been properly populated.
        self.onBeforeBinding = function() {
            console.log("Inside onBeforeBinding");
            console.log("gpio_boards via self.settingsViewModel.settings.plugins.chromatofore.gpio_boards()", self.settingsViewModel.settings.plugins.chromatofore.gpio_boards());
            self.pluginSettings = parameters[0].settings.plugins.chromatofore;
            console.log("self.pluginSettings.gpio_boards()", self.pluginSettings.gpio_boards());
            console.log("self.pluginSettings.servo_driver_boards()", self.pluginSettings.servo_driver_boards());


            var gpioAddresses = self.pluginSettings.gpio_boards();
            self.gpioBoards = ko.observableArray(gpioAddresses.map(function(address) {
                var board = new GpioBoard(address);
                board.addressInput("0x" + address.toString(16).toUpperCase().padStart(2, '0'));
                return board;
            }));
            
            console.log("self.gpioBoards() :", self.gpioBoards());


            var servoBoardAddresses = self.settingsViewModel.settings.plugins.chromatofore.servo_driver_boards();
            self.servoBoards = ko.observableArray(servoBoardAddresses.map(function(address) {
                var board = new ServoBoard(address);
                board.addressInput("0x" + address.toString(16).toUpperCase().padStart(2, '0'));
                return board;
            }));
            
            console.log("self.servo_boards() :", self.servoBoards());  

            // For Actuators
            var actuatorData = self.pluginSettings.actuators();
            self.actuators = ko.observableArray(actuatorData.map(function(data) {
                return new Actuator(data);
            }));
            console.log("self.actuators() :", self.actuators());            
            
            
        };    
        
        self.onSettingsBeforeSave = function() {
            console.log("Inside onSettingsBeforeSave");
            {
                var addresses = self.gpioBoards().map(function(gpioBoard) {
                    return gpioBoard.address();
                });
                console.log("Addresses within gpioBoards: ", addresses);   
                // Update the original settings with the new values
                self.settingsViewModel.settings.plugins.chromatofore.gpio_boards(addresses);    
                //self.pluginSettings.gpio_boards(addresses);                       
            }

            {
                var addresses = self.servoBoards().map(function(servoBoard) {
                    return servoBoard.address();
                });
                console.log("Addresses within servoSoards: ", addresses);   
                // Update the original settings with the new values
                self.settingsViewModel.settings.plugins.chromatofore.servo_driver_boards(addresses); 
                //self.pluginSettings.servo_driver_boards(addresses);                            
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


