// octoprint_chromatofore/static/js/chromatofore.js

$(function() {

    function ChromatoforeViewModel(parameters) {

        var self = this;

        self.settingsViewModel = parameters[0];

        // KnockoutJS observable for your plugin's settings
        self.gpio_boards = ko.observableArray([]);
        self.servo_driver_boards = ko.observableArray([]);
        self.actuators = ko.observableArray([]);

        // Load initial data from settings
        // if(parameters[0] && parameters[0].settings && parameters[0].settings.plugins && parameters[0].settings.plugins.chromatofore && parameters[0].settings.plugins.chromatofore.gpio_boards) {
        //     self.gpio_boards(parameters[0].settings.plugins.chromatofore.gpio_boards());
        // }

        // Operations
        self.addGpioBoard = function() {
            self.gpio_boards.push('');
        };

        self.removeGpioBoard = function(board) {
            self.gpio_boards.remove(board);
        };        

        // This will get called before the ChromatoforeViewModel gets bound to the DOM, but after its
        // dependencies have already been initialized. It is especially guaranteed that this method
        // gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
        // the SettingsViewModel been properly populated.
        self.onBeforeBinding = function() {
            var pluginSettings = self.settingsViewModel.settings.plugins.chromatofore;
            self.gpio_boards(pluginSettings.gpio_boards);
        }        
        

        // // This will be executed once OctoPrint initializes the view model
        // self.onAfterBinding = function() {
        //     console.log("Inside onAfterBinding");
        //     // Here, we fetch the plugin settings and assign them to our observables
        //     var pluginSettings = self.settingsViewModel.settings.plugins.chromatofore;
        //     console.log("pluginSettings:", pluginSettings);
            
        //     self.gpio_boards(pluginSettings.gpio_boards);
        //     self.servo_driver_boards(pluginSettings.servo_driver_boards);
        //     self.actuators(pluginSettings.actuators);

        //     // For debugging purposes
        //     console.log(self.gpio_boards());
        //     console.log(self.servo_driver_boards());
        //     console.log(self.actuators());
        // };


    
    }

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore"]
    }); 


});

console.log("Exit chromatofore.js")


