'''The filament sensors are physically implemented by 3d printed parts attached to the Medusa filament multiplexer, as well as 
micro limit switches and led's.

The limit switches and leds are attached to PCA8574 breakout board.  This breakout board both drives the LEDs as well as sensing the
limit switches.  The LED's should be lit if the limit switch is triggered (indicating the prescense of filament).

The PCF8574 has quasi-bidirectional I/O ports. When you want to set a pin as an input, you write a 1 to that pin. 
This puts the pin in a high-impedance state, meaning the PCF8574 won't actively drive the pin high or low; 
it'll effectively "disconnect" from the pin and just listen to whatever voltage is on it. This high-impedance state 
is often termed as "floating" in digital electronics. A floating pin can be driven to either high or low by 
an external device, in this case, the microswitch.


Now, considering the wiring of the switch:

When the microswitch is not activated: The switch is open. Since you've set the PCF8574's pin to input (high-impedance) by writing a 1, 
the pin just sees the VCC voltage (through the resistor and LED), so it reads as HIGH.

When the microswitch is activated: The switch connects the LED's anode (and the attached pin) to GND. 
Thus, the LED lights up, and the PCF8574's pin reads a LOW because it's directly connected to ground.

Consequently, the filament is sensed when the pin value is false.


'''
from .limit_switch import LimitSwitch

from smbus2 import SMBus
import threading
import time

from .pcf8574GpioExtenderBoard import Pcf8574GpioExtenderBoard


class FilamentSensor:
    def __init__(self, data):  
        self.role = data.get("role")
        self.board = data.get("board")
        self.channel = data.get("channel")
        
        self.limit_switch = LimitSwitch(data)

    def is_filament_sensed(self) -> bool:
        return self.limit_switch.is_triggered()


    def to_data(self):
        return {
            'board': self.limit_switch.board,
            'channel': self.limit_switch.channel,     
            'role': self.role
        }        

    def __str__(self):
        return (f"FilamentSensor(Role: {self.role}, LimitSwitch: {self.limit_switch}")

    def __repr__(self):
        return (f"FilamentSensor(data={{'board': 0x{self.board:02X}, 'channel': {self.channel}, 'role': {repr(self.role)}}})")



class FilamentSensors :
    

    def __init__(self, i2c_address: int, refresh_seconds: float = 0.5, bus_number: int = 1):
        self.i2c_address = i2c_address;

    def is_filament_sensed(self, pin: int) -> (str, bool):
        error_message, pin_state = Pcf8574GpioExtenderBoard.read_channel(self.i2c_address, pin)
        return error_message, pin_state is False
    
    def get_input(self) -> int:
        return Pcf8574GpioExtenderBoard.get_input_for_board(self.i2c_address)
        

