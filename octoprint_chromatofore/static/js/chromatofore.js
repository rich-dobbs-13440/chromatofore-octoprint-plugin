// octoprint_chromatofore/static/js/chromatofore.js

console.log("Entering chromatofore.js");

function ChromatoforeViewModel(parameters) {

    try {
        console.log("Initializing fff ChromatoforeViewModel");
        console.log(parameters);
        console.log("Post printing parameters");
    } catch (error) {
        console.error("Error during ChromatoforeViewModel instantiation:", error);
    }
    var self = this;

    self.settings = parameters[0].settings;
    


    self.gpio_boards = ko.observableArray(self.settings.plugins.chromatofore.gpio_boards());
    
    // Add a board
    self.addGpioBoard = function() {
        self.gpio_boards.push("");
    };

    // Remove a board
    self.removeGpioBoard = function(board) {
        self.gpio_boards.remove(board);
    };

   
}

// Register the ViewModel
OCTOPRINT_VIEWMODELS.push([
    ChromatoforeViewModel,
    ["settingsViewModel"],
    "#settings_plugin_chromatofore"
]); 

console.log("Registered the ViewModel");


