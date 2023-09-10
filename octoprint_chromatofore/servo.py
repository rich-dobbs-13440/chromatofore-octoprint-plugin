from typing import Optional

from smbus2 import SMBus
import Adafruit_PCA9685

default_servo_driver_boards = [
    {   
        'address': 0x40,
        'note': 'Actuator servos for first five actuators'
     },
    {
        'address': 0x70,
        'note': 'Typically, reset boards address'
    }
]

class Servo:

    bus_number = 1 # Use bus number 1 for Raspberry Pi 3 and newer

    # Depending on your servo make, the pulse width min and max may vary.
    # You want these to be as small/large as possible without hitting the hard stop
    # for max range. You'll have to tweak them as necessary to match the servos you have.
    
    # This is the 'minimum' pulse length count (out of 4096)
    SERVOMIN = 150  
    
    # This is the 'maximum' pulse length count (out of 4096)
    SERVOMAX = 600  
    
    # This is the rounded 'minimum' microsecond length based on the minimum pulse of 150
    USMIN = 600  
    
    # This is the rounded 'maximum' microsecond length based on the maximum pulse of 600
    USMAX = 2400  
    
    # Analog servos run at ~50 Hz updates
    SERVO_FREQ = 50      

    @staticmethod
    def set_bus_number(bus_number: int): 
        Servo.bus_number = bus_number


    @staticmethod
    def set_servo_angle(board: int, channel: int, angle: int) -> Optional[str]:
        if angle < 0:
            return "Error: Angle cannot be negative."
        if angle > 180:
            return "Error: Angle cannot be greater than 180."
        
        # Check if the board is accessible
        try:
            with SMBus(Servo.bus_number) as bus: 
                # Simple check, adjust based on your board specifics
                bus.write_quick(board)
        except:
            return f"Error: board 0x{board:02X} not found on bus {Servo.bus_number}"   
        
        pwm = Adafruit_PCA9685.PCA9685(address=board, busnum=Servo.bus_number)
        pwm.set_pwm_freq(Servo.SERVO_FREQ)  # Set the PWM frequency
        
        pulse = int((angle / 180.0) * (Servo.SERVOMAX - Servo.SERVOMIN) + Servo.SERVOMIN)
        try:
            pwm.set_pwm(channel, 0, pulse) 
        except IndexError: 
            return f"Bad channel {channel}"          

        # If everything succeeds
        return None
    
    @staticmethod
    def rest_servo(board: int, channel: int):
        """Set the servo at rest."""
        pwm = Adafruit_PCA9685.PCA9685(address=board, busnum=Servo.bus_number)
        pwm.set_pwm(channel, 0, 0)          

    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.max_angle = data.get("max_angle")
        self.min_angle = data.get("min_angle")
        self.role = data.get("role")
        self.is_action_reversed = data.get("is_action_reversed", False)
        self._current_angle = (self.max_angle + self.min_angle) / 2
        self._at_rest = False
        self.at_rest = True

    @property
    def position(self) -> float:
        """Get position based on the current angle."""
        if self._at_rest:
            # If the servo is at rest, its position is not definitive.
            return None        
        if self.is_action_reversed:
            return (self.max_angle - self._current_angle) / (self.max_angle - self.min_angle)
        else:
            return (self._current_angle - self.min_angle) / (self.max_angle - self.min_angle)

    @position.setter
    def position(self, value: float):
        """Set the angle based on the given position."""
        if not (0 <= value <= 1):
            raise ValueError("Position must be between 0 and 1.")
        
        # Calculate angle based on position
        if self.is_action_reversed:
            self.current_angle = self.max_angle - value * (self.max_angle - self.min_angle)
        else:
            self.current_angle = self.min_angle + value * (self.max_angle - self.min_angle)

        # The servo is not at rest because its now holding an angle.
        self._at_rest = False            

    @property
    def current_angle(self) -> float:
        if self._at_rest:
            # If the servo is at rest, its position is not definitive.
            return None        
        """Get the current angle."""
        return self._current_angle 

    @current_angle.setter
    def current_angle(self, angle: float):
        """Set and remember the current angle, then move the servo to that angle."""
        if not (self.min_angle <= angle <= self.max_angle):
            raise ValueError(f"Angle must be between {self.min_angle} and {self.max_angle}.")
        
        self._current_angle = angle
        error_msg = self.set_servo_angle(self.board, self.channel, int(self._current_angle))
        if error_msg:
            raise Exception(error_msg)  
        self._at_rest = False   

    @property
    def at_rest(self) -> bool:
        """Get the state of the servo."""
        return self._at_rest        

    @at_rest.setter
    def at_rest(self, state: bool):
        """Set the state of the servo."""
        if state:
            Servo.rest_servo(self.board, self.channel)
        self._at_rest = state                 

    def __str__(self):
        return f"Servo(Role: {self.role}, Board: 0x{self.board:02X}, Channel: {self.channel}, " \
               f"Angle Range: {self.min_angle}° - {self.max_angle}°)"

    def __repr__(self):
        return f"Servo(data={{'board': 0x{self.board:02X}, 'channel': {self.channel}, " \
               f"'max_angle': {self.max_angle}, 'min_angle': {self.min_angle}, 'role': {repr(self.role)}}})"
    
    def to_data(self):
        return {
            'board': self.board,
            'channel': self.channel,
            'role': self.role,
            'max_angle': self.max_angle,
            'min_angle': self.min_angle           
        } 
    