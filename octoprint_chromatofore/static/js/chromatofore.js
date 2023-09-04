// octoprint_chromatofore/static/js/chromatofore.js

$(function() {


    function containsBoardWithAddress(array, address) {
        return array.some(function(board) {
            return ko.unwrap(board.address) === address; // ko.unwrap ensures that if it's an observable, you get the underlying value.
        });
    }

    function sortServoBoards(servoBoards) {
        servoBoards.sort(function(a, b) {
            // Convert hexadecimal strings to integers for comparison
            var addressA = parseInt(ko.unwrap(a.address), 16);
            var addressB = parseInt(ko.unwrap(b.address), 16);
    
            return addressA - addressB;  // Sort in ascending order
        });
    }

    function findNextAvailableAddress(boardsArray, baseAddress) {
        var currentAddress = baseAddress;
    
        // Convert hex string to integer, e.g., "0x40" -> 64
        while (containsBoardWithAddress(boardsArray, currentAddress)) {
            currentAddress++;  // Increment the address
        }
    
        return currentAddress;
    }
    
 

    

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

        // Operations
        self.addGpioBoard = function() {
            self.gpioBoards.push(new I2cBoard(0x20));
            console.log("After adding gpio board: ", self.gpioBoards());
            console.log(self.gpioBoards());
        };

        self.removeGpioBoard = function(board) {
            self.gpioBoards.remove(board);
        };      
        
        self.addServoBoard = function() {
            var nextAddress = findNextAvailableAddress(self.servoBoards(), 0x40); 
            self.servoBoards.push(new I2cBoard(nextAddress));
            sortServoBoards(self.servoBoards);
            console.log("After adding servo board: ", self.servoBoards());  
            self.availableServoBoards = self.servoBoards().map(function(board) {
                return board.addressInput;
            });
        };

        self.removeServoBoard = function(board) {
            self.servoBoards.remove(board);
            self.availableServoBoards = self.servoBoards().map(function(board) {
                return board.addressInput;
            });
        }
        
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
            console.log("self.pluginSettings.gpio_boards() as JS", ko.toJS(self.pluginSettings.gpio_boards()));
            console.log("self.pluginSettings.servo_driver_boards() as JS", ko.toJS(self.pluginSettings.servo_driver_boards()));
            console.log("self.pluginSettings.actuators() as JS", ko.toJS(self.pluginSettings.actuators()));

            // For Actuators
            var actuatorData = ko.toJS(self.pluginSettings.actuators);
            self.actuators = ko.observableArray(actuatorData.map(function(data) {
                return new Actuator(data,  self.selectedRefreshRateInSeconds);
            }));
            console.log("self.actuators() :", self.actuators());               


            var gpioBoardData = ko.toJS(self.pluginSettings.gpio_boards);
            self.gpioBoards = ko.observableArray(gpioBoardData.map(function(data) {
                var board = new I2cBoard(data);
                return board;
            }));
            console.log("self.gpioBoards() :", self.gpioBoards());


            var servoBoardData = ko.toJS(self.pluginSettings.servo_driver_boards);
            self.servoBoards = ko.observableArray(servoBoardData.map(function(data) {
                var board = new I2cBoard(data);
                return board;
            }));
            console.log("self.servoBoards() :", self.servoBoards());  
         
            self.availableServoBoards = self.servoBoards().map(function(board) {
                return board.addressInput();
            });
            console.log("self.availableServoBoards :", self.availableServoBoards);  

            self.servoBoards.subscribe(function(changes) {
                // This callback will process changes (added or removed items)
            
                changes.forEach(function(change) {
                    if (change.status === 'added') {
                        // If a new board is added, we should subscribe to its addressInput changes
                        change.value.addressInput.subscribe(function(newValue) {
                            self.updateAvailableServoBoards();
                        });
                    }
                    // You can also handle 'deleted' items if necessary
                });
            
            }, null, "arrayChange");
    
            
            self.updateAvailableServoBoards = function() {
                self.availableServoBoards = self.servoBoards().map(function(board) {
                    return board.addressInput();
                });
                console.log("self.availableServoBoards() :", self.availableServoBoards());  
            };  

            self.availableGpioBoards =  self.gpioBoards().map(function(board) {
                return board.addressInput();
            });
            
            console.log("self.availableGpioBoards :", self.availableGpioBoards);  

            self.gpioBoards.subscribe(function(changes) {
                // This callback will process changes (added or removed items)
            
                changes.forEach(function(change) {
                    if (change.status === 'added') {
                        // If a new board is added, we should subscribe to its addressInput changes
                        change.value.addressInput.subscribe(function(newValue) {
                            self.updateAvailableGpioBoards();
                        });
                    }
                    // You can also handle 'deleted' items if necessary
                });
            
            }, null, "arrayChange");  
            
            self.updateAvailableGpioBoards = function() {
                self.availableGpioBoards = self.gpioBoards().map(function(board) {
                    return board.addressInput();
                });
                console.log("self.availableGpioBoards() :", self.availableGpioBoards);  
            };              
        };    
        
        self.onSettingsBeforeSave = function() {
            console.log("Inside onSettingsBeforeSave");
            {
                var data = self.gpioBoards().map(function(board) {
                    return board.toData();
                });
                console.log("GPIO board data to save:", data);   
                // Update the original settings with the new values
                self.pluginSettings.gpio_boards(data);                       
            }
            {
                var data = self.servoBoards().map(function(board) {
                    return board.toData();
                });
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


        self.combinedServoBoards = function(currentBoard) {
            return ko.computed(function() {
                // Check if the current board is already in the availableServoBoards list
                if (self.availableServoBoards.indexOf(currentBoard()) === -1) {
                    // If not, add it to the list
                    return [self.availableServoBoards, currentBoard()].flat();
                } else {
                    // If it's already in the list, just return the original list
                    return self.availableServoBoards;
                }
            });
        };


        self.combinedGpioBoards = function(currentBoard) {
            return ko.computed(function() {
                // Check if the current board is already in the availableServoBoards list
                if (self.availableGpioBoards.indexOf(currentBoard()) === -1) {
                    // If not, add it to the list
                    return [self.availableGpioBoards, currentBoard()].flat();
                } else {
                    // If it's already in the list, just return the original list
                    return self.availableGpioBoards;
                }
            });
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


