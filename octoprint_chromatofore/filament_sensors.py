'''The filament sensors are physically implemented by 3d printed parts attached to the Medusa filament multiplexer, as well as 
micro limit switches and led's.

The limit switches and leds are attached to PCA8574 breakout board.  This breakout board both drives the LEDs as well as sensing the
limit switches.  The LED's should be lit if the limit switch is triggered (indicating the prescense of filament).


'''

from smbus2 import SMBus
import threading
import time

class FilamentSensors :
    def __init__(self, i2c_address: int, refresh_seconds: float = 0.1, bus_number: int = 1):
        self.i2c_address = i2c_address;
        self.bus = smbus2.SMBus(bus_number)  # Use bus number 1 for Raspberry Pi 3 and newer
        self.running = False
        self.thread = None
        self.refresh_seconds = refresh_seconds
        self.input_value = 0;
        self.input_lock = threading.Lock()

    def get_pin_value(self, pin: int) -> bool:
            with self.input_lock:
                return bool(self.input_value & (1 << pin))        


    # Configure ports for input mode by writing all "1"'s to the addressed device port
    def configure_inputs(self):
        self.bus.write_byte(self.i2c_address, 0xFF)  # set ports high for input mode    

    def read_inputs(self) -> int:
        data_in = self.bus.read_byte(self.address)
        return data_in  

    def update_outputs(self, value: int):
        self.bus.write_byte(self.address, value)              

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
        self.configure_inputs()
        while self.running:
            with self.input_lock:
                self.input_value = self.read_inputs()            
            self.input_value = self.read_inputs()
            self.update_outputs(self.input_value)
            time.sleep(self.refresh_seconds)               

