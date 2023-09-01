// octoprint_chromatofore/static/js/chromatofore.js

$(function() {




    function setServoValue(actuatorIndex, servoRole, value) {
        var slider = document.querySelector('.angle-value[data-actuator-index="' + actuatorIndex + '"][data-servo-role="' + servoRole + '"]');
        if (slider) {
            slider.value = value;
        }
    }


    const gpioChannels = Array.from({ length: 8 }, (_, i) => '0x' + i.toString(16).toUpperCase());
    console.log("gpioChannels", gpioChannels); // Outputs: ["0x0", "0x1", "0x2", ..., "0x5", "0x6", "0x7"]    


    function toI2cAddress(value) {
        return "0x" + value.toString(16).toUpperCase().padStart(2, '0');
    }

    function toI2cChannel(value) {
        return "0x" + value.toString(16).toUpperCase();
    }
    

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
    
    
    function Servo(data) {
        var self = this;

        self.role = ko.observable(data.role);
    
        self.board = ko.observable(toI2cAddress(data.board));
        self.boardToInt = function() {
            var boardAsInt = parseInt(self.board(), 16);
            console.log("boardAsInt", boardAsInt);
            return boardAsInt;
        };
        self.channel = ko.observable(toI2cChannel(data.channel));
        self.channelToInt = function() {
            var channelAsInt = parseInt(self.channel(), 16);
            console.log("channelAsInt", channelAsInt);
            return channelAsInt;
        };
        self.min_angle = ko.observable(data.min_angle);
        self.max_angle = ko.observable(data.max_angle);
        initialValue = (data.min_angle + data.max_angle)/2;
        self.current_angle = ko.observable(initialValue);
        self.apiResponse = ko.observable("");
        self.isApiError = ko.observable(false); 
        

        self.min_angle.subscribe(function(newMin) {
            console.log('min_angle subscription triggered. New min_angle:', newMin, 'Current angle:', self.current_angle(), "Maximum angle:", self.max_angle());
            newMin = Math.min(newMin, self.current_angle(), self.max_angle());
            self.min_angle(newMin);
            console.log('After update,  min_angle:', self.min_angle());   
        });
        
        self.max_angle.subscribe(function(newMax) {
            console.log('max_angle subscription triggered. New max_angle:', newMax, 'Current angle:', self.current_angle(), 'Minimum angle:', self.min_angle());
            newMax = Math.max(newMax, self.current_angle(), self.min_angle());
            self.max_angle(newMax);
            console.log("After update,  max_angle:", self.max_angle());           
        });

        self.current_angle.subscribe(function(newVal) {
            console.log('current_angle subscription triggered. New current angle:', newVal, 'Minimum angle:', self.min_angle(), "Maximum angle:", self.max_angle());
            newVal = Math.max(newVal, self.min_angle());
            newVal = Math.min(newVal, self.max_angle());
            self.current_angle(newVal);
            console.log("After update,  current_angle:", self.current_angle());       
            
        OctoPrint.simpleApiCommand("chromatofore", "set_servo_angle", {
                board: self.boardToInt(),
                channel: self.channelToInt(),
                angle: parseInt(self.current_angle())
            }).done(function(response) {
                let currentTime = new Date().toLocaleTimeString(); 

                if (response.success === false) {
                    self.apiResponse(`${currentTime}: Failed to set servo angle. Details: ${response.reason || "No additional details available"}`);
                    self.isApiError(true);
                    return;
                }                
                self.apiResponse(`${currentTime}: ${response.message || "Successfully set servo angle."}`);
                self.isApiError(false);
            }).fail(function(jqXHR) {
                let currentTime = new Date().toLocaleTimeString(); 
                let responseText = jqXHR.responseText || "No additional details available";  
                self.apiResponse(`${currentTime}: Failed to set servo angle. Details: ${responseText}`);
                self.isApiError(true);
            });
                      
        });
          
        servoChannels = Array.from({ length: 16 }, (_, i) => '0x' + i.toString(16).toUpperCase());
        console.log("servoChannels:", servoChannels); // Outputs: ["0x0", "0x1", "0x2", ..., "0xE", "0xF"]   
        self.availableServoChannels = ko.observableArray(servoChannels);  
        console.log("self.availableServoChannels:", self.availableServoChannels());  
        
        self.toData = function() {
            return {
                role: self.role(),
                board: self.boardToInt(),
                channel: self.channelToInt(),
                min_angle: parseInt(self.min_angle()),
                max_angle: parseInt(self.max_angle())
            };
        };        
    }   


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
        console.log("data:", data);
        
        // Base properties
        self.id = ko.observable(data.id);
    
        // Use the Servo object for pusher, moving_clamp, fixed_clamp
        self.pusher = new Servo(data.pusher);
        self.moving_clamp = new Servo(data.moving_clamp);
        self.fixed_clamp = new Servo(data.fixed_clamp);  

    
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

        self.toData = function() {
            return {
                id: self.id(),
                pusher: self.pusher.toData(),
                moving_clamp: self.moving_clamp.toData(),
                fixed_clamp: self.fixed_clamp.toData(),
                pusher_limit_switch: {
                    board: self.pusher_limit_switch.board(),
                    channel: self.pusher_limit_switch.channel()
                },
                filament_sensor: {
                    board: self.filament_sensor.board(),
                    channel: self.filament_sensor.channel()
                }
            };
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
            var nextAddress = findNextAvailableAddress(self.servoBoards(), 0x40); 
            self.servoBoards.push(new ServoBoard(nextAddress));
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
        };         

      
        

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
                return new Actuator(data);
            }));
            console.log("self.actuators() :", self.actuators());               


            var gpioAddresses = self.pluginSettings.gpio_boards();
            self.gpioBoards = ko.observableArray(gpioAddresses.map(function(address) {
                var board = new GpioBoard(address);
                board.addressInput("0x" + address.toString(16).toUpperCase().padStart(2, '0'));
                return board;
            }));
            
            console.log("self.gpioBoards() :", self.gpioBoards());


            var servoBoardAddresses = self.pluginSettings.servo_driver_boards();
            self.servoBoards = ko.observableArray(servoBoardAddresses.map(function(address) {
                var board = new ServoBoard(address);
                board.addressInput("0x" + address.toString(16).toUpperCase().padStart(2, '0'));
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
                console.log("self.availableServoBoards :", self.availableServoBoards);  
            };  
        };    
        
        self.onSettingsBeforeSave = function() {
            console.log("Inside onSettingsBeforeSave");
            {
                var addresses = self.gpioBoards().map(function(gpioBoard) {
                    return gpioBoard.address();
                });
                console.log("Addresses within gpioBoards: ", addresses);   
                // Update the original settings with the new values
                // self.settingsViewModel.settings.plugins.chromatofore.gpio_boards(addresses);    
                self.pluginSettings.gpio_boards(addresses);                       
            }

            {
                var addresses = self.servoBoards().map(function(servoBoard) {
                    return servoBoard.address();
                });
                console.log("Addresses within servoSoards: ", addresses);   
                // Update the original settings with the new values
                //self.settingsViewModel.settings.plugins.chromatofore.servo_driver_boards(addresses); 
                self.pluginSettings.servo_driver_boards(addresses);                            
            }            

            var actuatorDataToSave = self.actuators().map(function(actuator) {
                return actuator.toData();
            });
            console.log("Actuators data to save: ", actuatorDataToSave);
            
            self.pluginSettings.actuators(actuatorDataToSave);

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


