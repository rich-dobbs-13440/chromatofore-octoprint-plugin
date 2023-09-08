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
      
    self.availableServoChannels = servoChannels;
    
    self.toData = function() {
        return {
            role: self.role(),
            board: self.boardToInt(),
            channel: self.channelToInt(),
            min_angle: parseInt(self.min_angle()),
            max_angle: parseInt(self.max_angle())
        };
    }; 
    
    self.hashCode = function() {
        return simpleHash(
            self.boardToInt(),
            self.channelToInt(),
            parseInt(self.min_angle()),
            parseInt(self.max_angle())
        );
    };
}   