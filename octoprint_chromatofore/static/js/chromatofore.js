// octoprint_chromatofore/static/js/chromatofore.js

$(function() {





    const gpioChannelsObservable = ko.observableArray(
        Array.from({ length: 8 }, (_, i) => '0x' + i.toString(16).toUpperCase())
    );

    const servoChannelsObservable = ko.observableArray(
        Array.from({ length: 16 }, (_, i) => '0x' + i.toString(16).toUpperCase())
    );    


    function setServoValue(actuatorIndex, servoRole, value) {
        var slider = document.querySelector('.angle-value[data-actuator-index="' + actuatorIndex + '"][data-servo-role="' + servoRole + '"]');
        if (slider) {
            slider.value = value;
        }
    }

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
            return boardAsInt;
        };
        self.channel = ko.observable(toI2cChannel(data.channel));
        self.channelToInt = function() {
            var channelAsInt = parseInt(self.channel(), 16);
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
          
        self.availableServoChannels = servoChannelsObservable;
        
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
        

    function GpioBoard(data, refreshRateInSeconds) {
        this.i2c_address = ko.observable(data.i2c_address);
        this.note = ko.observable(data.note);
        this.addressInput = ko.observable("0x" + data.i2c_address.toString(16).toUpperCase().padStart(2, '0'));
        this.refreshRate = refreshRateInSeconds; // This is an observable
    
        self.toData = function() {
            return {
                i2c_address: self.i2c_address(),
                note: self.note()
            };        
        }
    };

    function ServoBoard(address) {
        var self = this;
        self.address = ko.observable(address);
        self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0')); 
    }    

    function Actuator(data, refreshRateInSeconds) {
        var self = this;
        console.log("data:", data);

        self.refreshRate = refreshRateInSeconds;
        
        // The user provides a name for actuator
        self.id = ko.observable(data.id);
    
        // An acutuator has three servos:
        self.pusher = new Servo(data.pusher);
        self.moving_clamp = new Servo(data.moving_clamp);
        self.fixed_clamp = new Servo(data.fixed_clamp);  

    
        // An actuator has two limit switches:
        self.pusher_limit_switch = new Chromatofore.LimitSwitch("Pusher Limit Switch", data.pusher_limit_switch, self.refreshRate);
        self.filament_sensor = new Chromatofore.LimitSwitch("Filament Sensor", data.filament_sensor, self.refreshRate);

        // Observable to track visibility of details
        self._detailsVisible = ko.observable(true);  // Use an "underscore" prefix to denote private observables

        self.detailsVisible = ko.computed({
            read: function() {
                console.log("detailsVisible is being read:", self._detailsVisible());
                return self._detailsVisible();
            },
            write: function(value) {
                self._detailsVisible(value);
            }
        });

        // Function to toggle the visibility
        self.toggleDetails = function() {
            self.detailsVisible(!self.detailsVisible());
        };
        

        

        self.toData = function() {
            return {
                id: self.id(),
                pusher: self.pusher.toData(),
                moving_clamp: self.moving_clamp.toData(),
                fixed_clamp: self.fixed_clamp.toData(),
                pusher_limit_switch: self.pusher_limit_switch.toData(),
                filament_sensor: self.filament_sensor.toData(),
            };
        };
        

        self.getDataToBuildNextAcuator = function() {
            return {
                id: "new_actuator",
                pusher: {
                    role: "Pusher Servo",
                    board: self.pusher.boardToInt(),
                    channel: self.fixed_clamp.channelToInt() + 1,
                    min_angle: self.pusher.min_angle(),
                    max_angle: self.pusher.max_angle()
                },
                moving_clamp: {
                    role: "Moving Clamp Servo",
                    board: self.pusher.boardToInt(),
                    channel: self.fixed_clamp.channelToInt() + 2,
                    min_angle: self.moving_clamp.min_angle(),
                    max_angle: self.moving_clamp.max_angle()
                },
                fixed_clamp: {
                    role: "Fixed Clamp Servo",
                    board: self.pusher.boardToInt(),
                    channel: self.fixed_clamp.channelToInt() + 3,
                    min_angle: self.fixed_clamp.min_angle(),
                    max_angle: self.fixed_clamp.max_angle()
                },
                pusher_limit_switch: {
                    board: self.pusher_limit_switch.boardToInt(), 
                    channel: self.pusher_limit_switch.channelToInt() + 1,
                },
                filament_sensor: {
                    board: self.filament_sensor.boardToInt(), 
                    channel: self.filament_sensor.channelToInt() + 1
                }
            };
        }
        
  
    }
    
    Actuator.defaultData = {
        id: "new_actuator",
        pusher: {
            role: "Pusher Servo",
            board: 0x40,
            channel: 0x01,
            min_angle: 0,
            max_angle: 180
        },
        moving_clamp: {
            role: "Moving Clamp Servo",
            board: 0x40,
            channel: 0x1,
            min_angle: 0,
            max_angle: 90
        },
        fixed_clamp: {
            role: "Fixed Clamp Servo",
            board: 0x40,
            channel: 0x2,
            min_angle: 0,
            max_angle: 90
        },
        pusher_limit_switch: {
            board: 0x20,
            channel: 0x0
        },
        filament_sensor: {
            board: 0x21,
            channel: 0x0
        }
    }; 

    function ChromatoforeViewModel(parameters) {

        var self = this;
        self.refreshRates = [
            { text: "Never", value: 100000 },
            { text: "Every Second", value: 1 },
            { text: "Every Other Second", value: 2 },
            { text: "Every 5 Seconds", value: 5 },
            { text: "Every 10 Seconds", value: 10 },
        ];
        self.selectedRefreshRateInSeconds = ko.observable(1); // Default to 1 second  
        
        self.selectedAdressValidationRefreshRateInSeconds = ko.observable(60); // Default to once a minute  

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
                var board = new GpioBoard(data,  self.selectedAdressValidationRefreshRateInSeconds);
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
                var dataToSave = self.gpioBoards().map(function(board) {
                    return board.toData();
                });                
                console.log("Data to save for gpioBoards: ", dataToSave);   
                // Update the original settings with the new values  
                self.pluginSettings.gpio_boards(dataToSave);                       
            }

            {
                var addresses = self.servoBoards().map(function(servoBoard) {
                    return servoBoard.address();
                });
                console.log("Addresses within servoSoards: ", addresses);   
                // Update the original settings with the new values
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