import Adafruit_PCA9685

from typing import Optional, Dict

class Pca9685ServoDriverBoard:

    common_bus_number = 1 # Use bus number 1 for Raspberry Pi 3 and newer
    instances: Dict[int, 'Pca9685ServoDriverBoard'] = {}
    logger = None

    # Constants for the servo. This can be adjusted as needed
    SERVOMIN = 150
    SERVOMAX = 600
    USMIN = 600
    USMAX = 2400
    SERVO_FREQ = 50

    @staticmethod
    def set_bus_number(bus_number: int): 
        Pca9685ServoDriverBoard.common_bus_number = bus_number    

    @staticmethod
    def get_board(board_address: int) -> 'Pca9685ServoDriverBoard':
        # Get the board instance from the dictionary or create a new one
        board_instance = Pca9685ServoDriverBoard.instances.get(board_address)
        if not board_instance:
            board_instance = Pca9685ServoDriverBoard(i2c_address=board_address, bus_number=Pca9685ServoDriverBoard.common_bus_number)
            Pca9685ServoDriverBoard.instances[board_address] = board_instance
            Pca9685ServoDriverBoard.logger.info(f"New Pca9685ServoDriverBoard instance created for address: {board_address}")
        return board_instance

    def __init__(self, i2c_address: int, bus_number: int = 1):
        self.i2c_address = i2c_address
        self.pwm = Adafruit_PCA9685.PCA9685(address=self.i2c_address, busnum=bus_number)
        self.pwm.set_pwm_freq(self.SERVO_FREQ)  # Set the PWM frequency

    def set_servo_angle(self, channel: int, angle: int) -> Optional[str]:
        if angle < 0:
            return "Error: Angle cannot be negative."
        if angle > 180:
            return "Error: Angle cannot be greater than 180."

        pulse = int((angle / 180.0) * (self.SERVOMAX - self.SERVOMIN) + self.SERVOMIN)
        try:
            self.pwm.set_pwm(channel, 0, pulse) 
        except IndexError: 
            return f"Bad channel {channel}" 

        # If everything succeeds
        return None
    
    def rest_servo(self, channel: int):
        """Set the servo at rest."""
        self.pwm.set_pwm(channel, 0, 0)
