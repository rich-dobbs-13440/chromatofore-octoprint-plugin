from typing import Optional

from smbus2 import SMBus
import Adafruit_PCA9685

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
        
        # Check if the board is accessible
        try:
            with SMBus(Servo.bus_number) as bus: 
                # Simple check, adjust based on your board specifics
                bus.write_quick(board)
                # 
            

        except:
            return f"Error: board {board} not found on bus {Servo.bus_number}"   
        
        pwm = Adafruit_PCA9685.PCA9685(address=board, busnum=Servo.bus_number)
        # Convert the angle to a pulse length between 150 (0 degrees) and 600 (180 degrees)
        pulse = int((angle / 180.0) * 450 + 150)
        try:
            pwm.set_pwm(channel, 0, pulse) 
        except IndexError: 
            return f"Bad channel {channel}"          

        # If everything succeeds
        return None