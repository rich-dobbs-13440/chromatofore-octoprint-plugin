from typing import Optional
from time import sleep

from smbus2 import SMBus
from .pca9685_servo_driver_board import Pca9685ServoDriverBoard
## Pca9685ServoDriverBoard.get_board(YOUR_BOARD_ADDRESS).set_servo_angle(YOUR_CHANNEL, YOUR_ANGLE)


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

class ServoRuntimeError(RuntimeError):
    """Exception raised for runtime errors in the Servo class."""
    def __init__(self, message: str):
        super().__init__(message)

class Servo:

    bus_number = 1 # Use bus number 1 for Raspberry Pi 3 and newer

    @staticmethod
    def set_bus_number(bus_number: int): 
        Servo.bus_number = bus_number    


    @staticmethod
    def set_servo_angle(board: int, channel: int, angle: int) -> Optional[str]:
        if angle < 0:
            return "Error: Angle cannot be negative."
        if angle > 180:
            return "Error: Angle cannot be greater than 180."
        
        
        
        temp_servo =   Servo({
            "board": board,
            "channel": channel,
            "max_angle": 180,
            "min_angle": 0,
            "role": "test_servo"
        })
        error_message = None  
        try:
            temp_servo.current_angle = angle
        except ServoRuntimeError as e:
            error_message = f"Servo runtime error: {str(e)} extracted_data: {extracted_data}"
        except ValueError as e:
            error_message = f"Value error encountered: {str(e)} extracted_data: {extracted_data}"
        return error_message
        
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
    def rest_servo(board: int, channel: int) -> Optional[str]:
        """Set the servo at rest."""
        temp_servo =   Servo({
            "board": board,
            "channel": channel,
            "max_angle": 180,
            "min_angle": 0,
            "role": "test_servo"
        })
        error_message = None  
        temp_servo.at_rest = True
        return error_message       

    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.max_angle = data.get("max_angle")
        self.min_angle = data.get("min_angle")
        self.role = data.get("role")
        self.is_action_reversed = data.get("is_action_reversed", False)
        self._current_angle = (self.max_angle + self.min_angle) / 2
        self.at_rest = True
        self.sweep_time_step = 0.05


    def calc_angle_from_position(self, position: float) -> int:
        if self.is_action_reversed:
            angle = self.current_angle = self.max_angle - position * (self.max_angle - self.min_angle)
        else:
             angle = self.current_angle = self.min_angle + position * (self.max_angle - self.min_angle)
        return int(angle)

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
        self.current_angle = self.calc_angle_from_position(value)           

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
        if not (self.min_angle <= angle) and (angle <= self.max_angle):
            raise ValueError(f"Angle must be between {self.min_angle} and {self.max_angle}.")
        
        self._current_angle = angle
        error_msg = Pca9685ServoDriverBoard.get_board(self.board).set_servo_angle(self.channel, int(self._current_angle))
        if error_msg:
            raise ServoRuntimeError(error_msg)  
        # The servo is not at rest because its now holding an angle.
        self._at_rest = False   

    @property
    def at_rest(self) -> bool:
        """Get the state of the servo."""
        return self._at_rest        

    @at_rest.setter
    def at_rest(self, state: bool):
        """Set the state of the servo."""
        if state:
            # Servo.rest_servo(self.board, self.channel)
            Pca9685ServoDriverBoard.get_board(self.board).rest_servo(self.channel)
        else:
            self.current_angle = self._current_angle
        self._at_rest = state   

    def sweep_to_position(self, target_position, sweep_rate_degrees_per_second):
        target_angle = self.calc_angle_from_position(target_position)
        if self._current_angle is None:
            start_angle = (self.max_angle + self.min_angle) / 2
        else:
            start_angle = self._current_angle
        delta_angle_per_step = sweep_rate_degrees_per_second * self.sweep_time_step
        steps = min(int(abs(target_angle - start_angle)/delta_angle_per_step), 0)
        direction = 1 if target_angle > start_angle else -1
        angle = start_angle
        for _ in range(steps):
            angle  += delta_angle_per_step * direction
            self.current_angle = angle
            sleep(self.sweep_time_step)
        self.current_angle = target_angle
                          

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
    