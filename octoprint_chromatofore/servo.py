from typing import Optional

from smbus2 import SMBus
import Adafruit_PCA9685

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
    
  