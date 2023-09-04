

var globalLimitSwitchCounter = 0;  

function LimitSwitch(role, data, refreshRateInSeconds) {
    var self = this; 

    self.switchId = "switch-" + globalLimitSwitchCounter++;

    console.log("In new LimitSwitch.  role:", role, "data:", data);  

    self.refreshRate = refreshRateInSeconds;

    self.role = ko.observable(role);
    
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

    self.availableGpioChannels = gpioChannels;

    self.toData = function() {
        return {
            role: self.role(),
            board: self.boardToInt(),
            channel: self.channelToInt(),
        };
    };

    self.isApiError = ko.observable(false);     
    self.apiResponse = ko.observable("");    
    self.pinState = ko.observable(); // true, false, or null

    
    self.pinCssClass = ko.computed(function() {
        if (self.isApiError()) {
            return 'gray-diamond';
        }
        return self.pinState() ? 'green-upward-arrow' : 'green-downward-arrow';
    });    
    
    self.readLimitSwitch = function() {
    
        OctoPrint.simpleApiCommand("chromatofore", "read_limit_switch", {
            board: self.boardToInt(),
            channel: self.channelToInt()
        }).done(function(response) {
            let currentTime = new Date().toLocaleTimeString(); 
        
            if (response.success === false) {
                self.apiResponse(`${currentTime}: Failed to read limit switch. Details: ${response.reason || "No additional details available"}`);
                self.isApiError(true);
                self.pinState(null);
                return;
            } 
        
            // Handling for the pin_state; you may want to update an observable with this value
            let pinState = response.pin_state;
            if (pinState=== true) {
                self.apiResponse(`${currentTime}`);
                self.isApiError(false);
            } else if (pinState === false) {
                self.apiResponse(`${currentTime}`);
                self.isApiError(false);
            } else {
                self.apiResponse(`${currentTime}: Unknown limit switch state. Pin state received: ${pinState}`);
            }
            self.pinState(pinState);
        
            self.isApiError(false);
        
        }).fail(function(jqXHR) {
            let currentTime = new Date().toLocaleTimeString(); 
            let responseText = jqXHR.responseText || "No additional details available";  
            self.apiResponse(`${currentTime}: Failed to read limit switch. Details: ${responseText}`);
            self.isApiError(true);
        });
    }

    self.conditionallyReadLimitSwitch = function() {

        // Target the specific element using the unique switchId
        var pinStateElement = $('[data-switch-id="' + self.switchId + '"]');
    
        // Check if the element is visible
        if (pinStateElement.is(':visible') && isElementInViewport(pinStateElement[0])) {
            console.debug("Reading switch: ", self.switchId);
            self.readLimitSwitch();
        }
    };
    
    

    // Subscribe to changes in board or channel
    self.board.subscribe(function(newValue) {
        self.readLimitSwitch();
    });
    self.channel.subscribe(function(newValue) {
        self.readLimitSwitch();
    });  
    
    self.refreshRate.subscribe(function(newValue) {
        self.setupRefreshInterval();
    });  
    
    self.refreshIntervalId = null;

    self.setupRefreshInterval = function() {
        // Clear the existing interval
        if (self.refreshIntervalId) {
            clearInterval(self.refreshIntervalId);
            self.refreshIntervalId = null;
        }
    
        // If the refresh rate is not set to "never" (i.e., not set to the large value like 100000)
        if (self.refreshRate() < 100000) {
            self.refreshIntervalId = setInterval(function() {
                self.conditionallyReadLimitSwitch();
            }, self.refreshRate()*1000);
        }
    };

    self.setupRefreshInterval();

    self.dispose = function() {
        if (self.refreshIntervalId) {
            clearInterval(self.refreshIntervalId);
        }
    };        
    
        
}    

