// octoprint_chromatofore/static/js/chromatofore.js

$(function() {

    function ChromatoforeViewModel(parameters) {

        var self = this;

        self.settingsViewModel = parameters[0];

        // KnockoutJS observable for your plugin's settings
        self.gpio_boards = ko.observableArray([]);
        self.servo_driver_boards = ko.observableArray([]);
        self.actuators = ko.observableArray([]);
        

        // This will be executed once OctoPrint initializes the view model
        self.onAfterBinding = function() {
            // Here, we fetch the plugin settings and assign them to our observables
            var pluginSettings = self.settingsViewModel.settings.plugins.chromatofore;
            
            self.gpio_boards(pluginSettings.gpio_boards);
            self.servo_driver_boards(pluginSettings.servo_driver_boards);
            self.actuators(pluginSettings.actuators);

            // For debugging purposes
            console.log(self.gpio_boards());
            console.log(self.servo_driver_boards());
            console.log(self.actuators());
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


