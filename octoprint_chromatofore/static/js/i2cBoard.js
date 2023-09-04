

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
        console.error("Invalid data format for GpioBoard:", data);
        return;
    }

    self.address = ko.observable(address);
    self.addressInput = ko.observable("0x" + address.toString(16).toUpperCase().padStart(2, '0'));

    self.toData = function() {
        return {
            address: self.address(),
            note: self.note(),
        };
    };

}