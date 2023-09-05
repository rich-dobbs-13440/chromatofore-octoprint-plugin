
checkI2cAddress = function(address, foundCallback, notFoundCallback, failCallback) {
    OctoPrint.simpleApiCommand("chromatofore", "validate_i2c", { address: address })
    .done(function(response) {
        //console.log("Got response from simpleApiCommand");
        
        if (response.valid) {
            // If a callback for found is provided, call it
            if (typeof foundCallback === 'function') {
                foundCallback(address);
            }
        } else {
            // If a callback for not found is provided, call it
            if (typeof notFoundCallback === 'function') {
                notFoundCallback(address);
            }
        }
    })
    .fail(function() {
        if (typeof failCallback === 'function') {
            failCallback(address);
        }        
    });
}



function I2cBoard(data) {
    var self = this;
    
    // Check if data is an object (dictionary) or just a number (address)
    var address;
    if (typeof data === "object" && data.hasOwnProperty("address")) {
        // It's a dictionary
        address = data.address;
        // If a note property exists in the data object, use it, else default to an empty string
        self.note = ko.observable(data.note || "-- specify purpose and range of acutators --");
    } else if (typeof data === "number") {
        // It's just the address
        address = data;
        // Default note to empty string for this case
        self.note = ko.observable("");
    } else {
        console.error("Invalid data format for I2C Board:", data);
        return;
    }

    self.address = ko.observable(address);
    self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0'));
    self.isValid = ko.observable(false);

    self.addressInput.subscribe(function(newValue) {
        var addrValue = parseInt(newValue, 16); // Convert hex string to integer
        self.address(addrValue);
    }); 
    
    self.checkIfOnBus = function() {
        checkI2cAddress(self.address(), 
            function(address) {
                self.isValid(true);
            },
            function(address) {
                self.isValid(false);
            },
            function(address) {
                console.log("Got a fail from checkI2cAddress for address", address);
            }
        );        

    }

    self.checkIfOnBus();

    self.toData = function() {
        return {
            address: self.address(),
            note: self.note(),
        };
    };
}


var globalI2cBoardsCounter = 0;  



function I2cBoards(boardData, baseAddress, addressRange, refreshRateInSeconds) {
    var self = this;

    self.id = "boards-" + globalI2cBoardsCounter++;    

    self.baseAddress = baseAddress;
    self.addressRange = addressRange;
    self.addressMap = {};

    self.refreshRateInSeconds = refreshRateInSeconds;

    self.items = ko.observableArray(boardData.map(function(data) {
        return new I2cBoard(data);
    }));

    self.items().forEach(function(board) {
        self.addressMap[board.address()] = board;
    });    

    self.availableAddresses = ko.computed(function() {
        return self.items().map(function(board) {
            return board.addressInput();
        });
    });

    self.addressIsValid = function(address) {
        console.log("TODO: Handle addressIsValid for ", address);

        var board = self.addressMap[address];
        if (board) {
            console.log("Board found for address:", address);
            board.isValid(true); 
        } else {
            console.log("No board found for address:", address, "which is on bus.  Automatically added it:");
            self.addBoard(address);
        }        
    }

    self.addressIsNotValid = function(address) {
        console.log("TODO: Handle addressIsNotValid for ", address);
    }

    self.addressIsNotValid = function(address) {
        var board = self.addressMap[address];
        if (board) {
            console.log("Board not valid for address:", address);
            board.isValid(false); 
        } else {
            //console.log("No board found for address:", address);
        }
    }
    

    self.scanForBoards = async function() {
        // AJAX call to scan for I2C boards and handle the response
        // Update the self.items observable array accordingly

        console.log("Scanning for boards...")

        const pollingFrequenceInMillis = 500;

        // Iterate through the address range
        for (let i = 0; i < self.addressRange; i++) {
            let currentAddress = self.baseAddress + i; 
            checkI2cAddress(currentAddress, 
                function(address) {
                    self.addressIsValid(address);
                },
                function(address) {
                    self.addressIsNotValid(address);
                },
                function(address) {
                    console.log("Got a fail from checkI2cAddress for address", address);
                }
            ); 
            
            await sleep(pollingFrequenceInMillis);
        }       
    };   

    self.conditionallyScanForBoards = function() {
        // Target the specific element using the unique switchId
        var boardsElement = $('[data-boards-id="' + self.id + '"]');    
        // Check if the element is visible
        if (boardsElement.is(':visible') && isElementInViewport(boardsElement[0])) {
            console.debug("Starting scan: ", self.id);
            self.scanForBoards();
        }
    }
     
    self.refreshIntervalId = null;

    self.setupRefreshInterval = function() {
        // Clear the existing interval
        if (self.refreshIntervalId) {
            clearInterval(self.refreshIntervalId);
            self.refreshIntervalId = null;
        }
    
        // Set up the new interval
        if (self.refreshRateInSeconds() < 100000) {  // 100000 as the "never" value, just like in your LimitSwitch class
            self.refreshIntervalId = setInterval(function() {
                self.conditionallyScanForBoards();
            }, self.refreshRateInSeconds() * 1000);
        }
    };

    self.refreshRateInSeconds.subscribe(function(newValue) {
        self.setupRefreshInterval();
    });      

    self.dispose = function() {
        if (self.refreshIntervalId) {
            clearInterval(self.refreshIntervalId);
        }
    };    
    
    self.setupRefreshInterval();    

    self.addBoard = function(address) {
        // Check if the address is provided, if not find the next available address
        var boardAddress = address || self.findNextAvailableAddress();
        
        var board = new I2cBoard(boardAddress);
        self.addressMap[board.address()] = board;
        self.items.push(board);
        self.sort();
        console.log("Items after sort:", self.items());
    };
    

    self.removeBoard = function(board) {
        delete self.addressMap[board.address()];
        self.items.remove(board);
    };


    self.subscribeToChanges = function() {
        // Subscribe to address changes for new boards
        self.items.subscribe(function(changes) {
            changes.forEach(function(change) {
                if (change.status === 'added') {
                    let previousAddress; // to store the old address value
                    
                    // Before updating, keep the old address
                    change.value.address.subscribe(function(oldValue) {
                        previousAddress = oldValue;
                    }, null, "beforeChange");
                    
                    // When the new value is set
                    change.value.address.subscribe(function(newAddress) {
                        // If the previousAddress exists in the map, remove it
                        if (previousAddress !== undefined) {
                            delete self.addressMap[previousAddress];
                        }
    
                        // Now add the new address to the map
                        self.addressMap[newAddress] = change.value;
                        
                        // You may also want to check for conflicts here!
                        // If a board with this address already existed, decide how to handle it.
    
                        // Finally, sort if necessary
                        self.sort();
                    });
                }
                // Handle 'deleted' items if necessary
                // You should remove them from the addressMap
                if (change.status === 'deleted') {
                    delete self.addressMap[change.value.address()];
                }
            });
        }, null, "arrayChange");
    
        // Subscribe to address changes for existing boards
        ko.utils.arrayForEach(self.items(), function(board) {
            let previousAddress; // to store the old address value
            
            // Before updating, keep the old address
            board.address.subscribe(function(oldValue) {
                previousAddress = oldValue;
            }, null, "beforeChange");
    
            // When the new value is set
            board.address.subscribe(function(newAddress) {
                // If the previousAddress exists in the map, remove it
                if (previousAddress !== undefined) {
                    delete self.addressMap[previousAddress];
                }
    
                // Now add the new address to the map
                self.addressMap[newAddress] = board;
                
                // You may also want to check for conflicts here!
                // If a board with this address already existed, decide how to handle it.
    
                // Finally, sort if necessary
                self.sort();
            });
        });
    };
    

    self.subscribeToChanges();
    

    self.updateAvailableAddresses = function() {
        // Logic to update available addresses if needed
        // For now, just logging
        console.log("Updated addresses:", self.availableAddresses());
    };

    self.augmentedBoards = function(currentBoard) {
        return ko.computed(function() {
            // Check if the current board is already in the items list
            if (self.availableAddresses().indexOf(currentBoard()) === -1) {
                // If not, add it to the list
                return [self.availableAddresses(), currentBoard()].flat();
            } else {
                // If it's already in the list, just return the original list
                return self.availableAddresses();
            }
        });
    };

    self.findNextAvailableAddress = function() {
        var currentAddress = self.baseAddress;

        while (self.containsBoardWithAddress(currentAddress)) {
            currentAddress++;  // Increment the address
        }

        return currentAddress;
    };

    self.containsBoardWithAddress = function(address) {
        return self.availableAddresses().indexOf("0x" + address.toString(16).toUpperCase().padStart(2, '0')) !== -1;
    }; 

    self.sort = function() {
        var sortedArray = self.items().slice().sort(function(a, b) {
            // Convert hexadecimal strings to integers for comparison
            var addressA = parseInt(ko.unwrap(a.address), 16);
            var addressB = parseInt(ko.unwrap(b.address), 16);
            return addressA - addressB;  // Sort in ascending order
        });
        
        self.items(sortedArray);
    };
    

    self.toData = function() {
        return self.items().map(function(board) {
            return board.toData();
        });
    };



}
