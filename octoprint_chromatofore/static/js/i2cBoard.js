
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

function initializeI2cBoardBindings() {
    $("input.i2c-address").on("blur", function() {
        var value = $(this).val();
        var regex = /^0x[0-9a-fA-F]{2}$/;
        if (!regex.test(value)) {
            $(this).focus();
        }
    });
}



function I2cBoard(data, jumperCount) {
    var self = this;
    
    // Check if data is an object (dictionary) or just a number (address)
    var address;
    var defaultNote = "-- specify purpose and range of acutators --";
    if (typeof data === "object" && data.hasOwnProperty("address")) {
        // It's a dictionary
        address = data.address;
        // If a note property exists in the data object, use it, else set to default
        self.note = ko.observable(data.note || defaultNote);
    } else if (typeof data === "number") {
        // It's just the address
        address = data;
        self.note = ko.observable(defaultNote);
    } else {
        console.error("Invalid data format for I2C Board:", data);
        return;
    }
    self.jumperCount = jumperCount
    self.address = ko.observable(address);
    self.baseAddress = address & (~((1 << jumperCount) - 1));
    self.jumpers = ko.observableArray(
        Array.from({ length: self.jumperCount }).map((_, index) => 
            Boolean((address >> index) & 1)
        ).reverse()
    ); 
    self.jumpers.subscribe((newValue) => {
        let jumperAddress = newValue.slice().reverse().reduce((acc, jumperState, index) => {
            return acc + (jumperState ? (1 << index) : 0);
        }, 0);
        
        let fullAddress = self.baseAddress | jumperAddress;
        self.address(fullAddress);
        self.addressInput("0x" + fullAddress.toString(16).toUpperCase().padStart(2, '0'));
    });

    self.address.subscribe((newValue) => {
        let jumperBits = newValue & ((1 << self.jumperCount) - 1);
        self.jumpers(
            Array.from({ length: self.jumperCount }).map((_, index) => 
                Boolean((jumperBits >> index) & 1)
            ).reverse()
        );
    });
    
    
    self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0'));     
    self.isFoundOnI2cBus = ko.observable(false);      
    self.addressInput.subscribe(function(newValue) {
        // Use regex to check if newValue is a valid hex address
        if (/^0x[0-9a-fA-F]{2}$/.test(newValue)) { // Assuming a 2-byte address
            var addrValue = parseInt(newValue, 16);
            self.address(addrValue);
        }
    });
    
    
    self.checkIfOnBus = function() {
        checkI2cAddress(self.address(), 
            function(address) {
                self.isFoundOnI2cBus(true);
            },
            function(address) {
                self.isFoundOnI2cBus(false);
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
    self.jumperCount = Math.round(Math.log2(self.addressRange));
   

    self.refreshRateInSeconds = refreshRateInSeconds;

    self.items = ko.observableArray(boardData.map(function(data) {
        return new I2cBoard(data, self.jumperCount);
    }));

    self.addressMap = {};
    self.items().forEach(function(board) {
        self.addressMap[board.address()] = board;
    });  

    // When adding a board, it is intially given the lowest address that is no
    // no other board is using.
    self.findNextAvailableAddress = function() {
        // Iterate through the address range
        for (let i = 0; i < self.addressRange; i++) {
            let currentAddress = self.baseAddress + i; 
            if (!(currentAddress in self.addressMap)) {
                return currentAddress;
            }
        }
        return -1;
    };       

    self.addBoard = function(address) {
        console.log("address in addBoard", address);
        // Check if the address is provided, if not find the next available address
        var boardAddress = address || self.findNextAvailableAddress();
        console.log("boardAddress in addBoard", boardAddress);
        if (boardAddress > 0) {
            var board = new I2cBoard(boardAddress, self.jumperCount);
            self.addressMap[board.address()] = board;
            self.items.push(board);
            self.sort();
            console.log("Items after sort:", self.items());
        } else {
            var msg = "Can't add board.  Unable to next available address in range for baseAddress:" +  toI2cAddress(self.baseAddress) + " range: " + toI2cAddress(self.addressRange);
            console.log(msg);
            // OctoPrint.coreui.showAlert("Unable to find next available address in range", "alert-warning"); 
            new PNotify({
                title: 'Unable to Add Board',
                text: msg,
                type: 'error' // can be 'info', 'success', 'error', or 'notice'
            });
        }
    }; 

    self.removeBoard = function(board) {
        delete self.addressMap[board.address()];
        self.items.remove(board);
    };
    
    self.sort = function() {
        var sortedArray = self.items().slice().sort(function(a, b) {
            return a.address() - b.address();  // Sort in ascending order
        });
        self.items(sortedArray);
    };    

    self.toData = function() {
        return self.items().map(function(board) {
            return board.toData();
        });
    };    


    self.augmentedAddresses = function(currentAddressObservable) {
        currentAddressAsInt = parseInt(currentAddressObservable(), 16);
        var board = self.addressMap[currentAddressAsInt];
        if (!board) {
            self.addBoard(currentAddressAsInt);
        }
        return self.availableAddresses();
    };    
      

    self.availableAddresses = ko.computed(function() {
        var list = self.items().map(function(board) {
            return board.addressInput();
        });
        console.log("availableAddresses list: ", list);
        return list;
    });

 


    // Handle the scan of the I2C bus in the address range for these boards
    //   If something responds from the bus when queried and it is a board 
    //   in the collection, then it is updated.  

    //   If it not in the collection, a new board is created and
    //   it is added to the collection.  Whenever a board is created,
    //   it checks if it is on the bus, so it will have a current
    //   check on the bus.

    //   If nothing responds on the bus, and it is a board in the collection,
    //   then it is update to show that it hasn't been found.    


    self.addressFoundOnI2cBus = function(address) {
        var board = self.addressMap[address];
        if (board) {
            console.log("Board found for address:", toI2cAddress(address));
            board.isFoundOnI2cBus(true); 
        } else {
            console.log("No board found for address:", toI2cAddress(address), "which is on bus.  Automatically added it:");
            self.addBoard(address);
        }        
    }

    self.addressNotFoundOnI2cBus = function(address) {
        var board = self.addressMap[address];
        if (board) {
            console.log("Board not valid for address:", address);
            board.isFoundOnI2cBus(false); 
        } else {
            //console.log("No board found for address:", toI2cAddress(address));
        }
    }    
    
    self.scanForBoards = async function() {
        console.log("Scanning for boards...")

        const pollingFrequenceInMillis = 500;

        // Iterate through the address range
        for (let i = 0; i < self.addressRange; i++) {
            let currentAddress = self.baseAddress + i; 
            checkI2cAddress(currentAddress, 
                function(address) {
                    self.addressFoundOnI2cBus(address);
                },
                function(address) {
                    self.addressNotFoundOnI2cBus(address);
                },
                function(address) {
                    console.log("Got a fail from checkI2cAddress for address", address);
                }
            ); 
            
            await sleep(pollingFrequenceInMillis);
        }        
    };  

    self.conditionallyScanForBoards = function() {
        // The periodic scan of the bus only happens when the settings page
        // is displayed and the board details are visible.

        // Find the specific element using the unique id
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
    








}
