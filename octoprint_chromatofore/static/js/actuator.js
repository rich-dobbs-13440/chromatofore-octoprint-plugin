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
    self.pusher_limit_switch = new LimitSwitch("Pusher Limit Switch", data.pusher_limit_switch, self.refreshRate);
    self.filament_sensor = new LimitSwitch("Filament Sensor", data.filament_sensor, self.refreshRate);

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
};   

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