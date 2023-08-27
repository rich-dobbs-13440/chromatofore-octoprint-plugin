// octoprint_chromatofore/static/js/chromatofore.js

$(function() {

    function GpioBoard(address) {
        this.address = ko.observable(address);
    }

    function ChromatoforeViewModel(parameters) {

        var self = this;



        self.settingsViewModel = parameters[0];

        // KnockoutJS observable for your plugin's settings
        //self.gpio_boards = ko.observableArray([]);
        //self.servo_driver_boards = ko.observableArray([]);
        //self.actuators = ko.observableArray([]);


        // Operations
        self.addGpioBoard = function() {
            console.log("Inside addGpioBoard");
            console.log("Before adding: ", self.gpio_boards());
            self.gpio_boards.push(new GpioBoard('0x2?'));
            console.log("After adding: ", self.gpio_boards());
            console.log(self.gpio_boards());
        };

        self.removeGpioBoard = function(board) {
            self.gpio_boards.remove(board);
        };        

        // This will get called before the ChromatoforeViewModel gets bound to the DOM, but after its
        // dependencies have already been initialized. It is especially guaranteed that this method
        // gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
        // the SettingsViewModel been properly populated.
        self.onBeforeBinding = function() {
            console.log("Inside onBeforeBinding");
            //var pluginSettings = self.settingsViewModel.settings.plugins.chromatofore;
            console.log("gpio_boards via self.settingsViewModel.settings.plugins.chromatofore.gpio_boards()", self.settingsViewModel.settings.plugins.chromatofore.gpio_boards());
            self.mySettings = parameters[0].settings.plugins.chromatofore;
            console.log("self.mySettings.gpio_boards()", self.mySettings.gpio_boards());
            //console.log("pluginSettings:", pluginSettings);
            //self.gpio_boards = ko.observableArray(self.settingsViewModel.settings.plugins.chromatofore.gpio_boards());
            var gpioAddresses = self.settingsViewModel.settings.plugins.chromatofore.gpio_boards();
            self.gpio_boards = ko.observableArray(gpioAddresses.map(function(address) {
                return new GpioBoard(address);
            }));
            console.log("self.gpio_boards() :", self.gpio_boards());
        };    
        
        self.onSettingsBeforeSave = function() {
            console.log("Inside onSettingsBeforeSave");
            var addresses = self.gpio_boards().map(function(gpioBoard) {
                return gpioBoard.address();
            });
            console.log("Addresses within gpio_boards: ", addresses);

            // Update the original settings with the new values
            self.settingsViewModel.settings.plugins.chromatofore.gpio_boards(addresses);
        };


        self.validateGpioBoard = function(address) {
            // This should make an AJAX request to your plugin's backend to verify the address.
            OctoPrint.simpleApiCommand("chromatofore", "validate_i2c", { address: address }).done(function(response) {
                console.log("Got response from simpleApiCommand");
                if (response.valid) {
                    alert('Address ' + address + ' is valid!');
                } else {
                    alert('Address ' + address + ' is not accessible!');
                }
            });
        }


        
    
    }

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore"]
    }); 


});

console.log("Exit chromatofore.js")


