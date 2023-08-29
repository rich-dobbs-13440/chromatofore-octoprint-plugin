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

from smbus2 import SMBus
import threading
import time

class FilamentSensors :
    def __init__(self, i2c_address: int, refresh_seconds: float = 0.5, bus_number: int = 1):
        self.i2c_address = i2c_address;
        self.bus = SMBus(bus_number)  # Use bus number 1 for Raspberry Pi 3 and newer
        self.running = False
        self.thread = None
        self.refresh_seconds = refresh_seconds
        self.input_value = 0;
        self.input_lock = threading.Lock()


    def get_input(self) -> int:
        with self.input_lock:
            return self.input_value;


    def is_filament_sensed(self, pin: int) -> bool:
            with self.input_lock:
                return not bool(self.input_value & (1 << pin))        


    # Configure ports for input mode by writing all "1"'s to the addressed device port
    def configure_inputs(self):
        self.bus.write_byte(self.i2c_address, 0xFF)  # set ports high for input mode    

    def read_inputs(self) -> int:
        data_in = self.bus.read_byte(self.i2c_address)
        return data_in  

    def update_outputs(self, value: int):
        self.bus.write_byte(self.i2c_address, value)              

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop)
            self.thread.start()

    def stop(self):
        if self.running:
            self.running = False
            self.thread.join()     

    def _run_loop(self):
        
        while self.running:
            self.configure_inputs();
            with self.input_lock:
                self.input_value = self.read_inputs()            
            #self.update_outputs(self.input_value)
            time.sleep(self.refresh_seconds)               

