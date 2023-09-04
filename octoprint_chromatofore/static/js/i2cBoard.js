

function I2cBoard(data) {
    var self = this;
    
    // Check if data is an object (dictionary) or just a number (address)
    var address;
    if (typeof data === "object" && data.hasOwnProperty("address")) {
        // It's a dictionary
        address = data.address;
        // If a note property exists in the data object, use it, else default to an empty string
        self.note = ko.observable(data.note || "-- content to drive development--");
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

    self.addressInput.subscribe(function(newValue) {
        var addrValue = parseInt(newValue, 16); // Convert hex string to integer
        self.address(addrValue);
    });    

    self.toData = function() {
        return {
            address: self.address(),
            note: self.note(),
        };
    };


}


function I2cBoards(boardData, baseAddress) {
    var self = this;

    self.baseAddress = baseAddress;

    self.items = ko.observableArray(boardData.map(function(data) {
        return new I2cBoard(data);
    }));

    self.availableAddresses = ko.computed(function() {
        return self.items().map(function(board) {
            return board.addressInput();
        });
    });

    self.addBoard = function(baseAddress) {
        var nextAddress = self.findNextAvailableAddress();
        self.items.push(new I2cBoard(nextAddress));
        self.sort();
        console.log("Items after sort:", self.items());
    };

    self.removeBoard = function(board) {
        self.items.remove(board);
    };

    self.subscribeToChanges = function() {
        // Subscribe to address changes for new boards
        self.items.subscribe(function(changes) {
            changes.forEach(function(change) {
                if (change.status === 'added') {
                    change.value.address.subscribe(function() {
                        self.sort();
                    });
                }
                // Handle 'deleted' items if necessary
            });
        }, null, "arrayChange");
        
        // Subscribe to address changes for existing boards
        ko.utils.arrayForEach(self.items(), function(board) {
            board.address.subscribe(function() {
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
