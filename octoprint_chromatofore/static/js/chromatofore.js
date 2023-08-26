// octoprint_chromatofore/static/js/chromatofore.js

function ChromatoforeViewModel(parameters) {
    var self = this;

    self.settings = parameters[0];

    self.gpio_boards = ko.observableArray(self.settings.settings.plugins.chromatofore.gpio_boards());
    
    // Add a board
    self.addGpioBoard = function() {
        self.gpio_boards.push("");
    };

    // Remove a board
    self.removeGpioBoard = function(board) {
        self.gpio_boards.remove(board);
    };

    // Register the ViewModel
    OCTOPRINT_VIEWMODELS.push([
        ChromatoforeViewModel,
        ["settingsViewModel"],
        "#settings_plugin_chromatofore"
    ]);    
}


// $(function() {
//     function ChromatoforeViewModel(parameters) {
//         var self = this;

//         // Link to global settings
//         self.settings = parameters[0];

//         // Function to add a new GPIO board address
//         self.addGPIOBoard = function() {
//             self.settings.plugins.chromatofore.gpio_boards.push("");
//         };

//         // Function to remove a GPIO board address
//         self.removeGPIOBoard = function(index) {
//             self.settings.plugins.chromatofore.gpio_boards.splice(index, 1);
//         };

//         // Function to update a GPIO board address
//         self.updateGPIOBoard = function(data, event) {
//             var index = self.settings.plugins.chromatofore.gpio_boards.indexOf(data);
//             if (index > -1) {
//                 var value = event.target.value;
//                 if (/^[0-9a-fA-F]{1,2}$/.test(value)) {  // Checks for valid 7-bit hex value
//                     self.settings.plugins.chromatofore.gpio_boards.splice(index, 1, value);
//                 } else {
//                     alert("Please enter a valid 7-bit hexadecimal value.");
//                     event.target.focus();
//                 }
//             }
//         };
//     }

//     // Register the ViewModel
//     OCTOPRINT_VIEWMODELS.push([
//         ChromatoforeViewModel,
//         ["settingsViewModel"],
//         "#settings_plugin_chromatofore"
//     ]);
// });
