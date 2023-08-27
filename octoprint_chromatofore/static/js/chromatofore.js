// octoprint_chromatofore/static/js/chromatofore.js

$(function() {

    function ChromatoforeViewModel(parameters) {

        var self = this;

        self.settings = parameters[0].settings();
        self.settingsViewModel = parameters[0];
        //self.settings = self.settingsViewModel.settings;
        

        // Function to log the settings
        self.logSettings = function() {
            console.log(self.settingsViewModel);
            console.log(self.settings);
            
            //console.log(self.settings.plugins.chromatofore);
        };

        self.logSettings();

    
    }

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push({ 
        construct: ChromatoforeViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_chromatofore"]
    }); 


});

console.log("Exit chromatofore.js")


