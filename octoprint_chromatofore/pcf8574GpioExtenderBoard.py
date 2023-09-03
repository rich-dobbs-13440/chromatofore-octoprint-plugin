''' 

The PCF8574 GPIO Extender Board has quasi-bidirectional I/O ports. When you want to set a pin as an input, you write a 1 to that pin. 
This puts the pin in a high-impedance state, meaning the PCF8574 won't actively drive the pin high or low; 
it'll effectively "disconnect" from the pin and just listen to whatever voltage is on it. This high-impedance state 
is often termed as "floating" in digital electronics. A floating pin can be driven to either high or low by 
an external device, in this case, the microswitch.



'''

from smbus2 import SMBus
import threading
import time


from typing import Optional, Dict

class Pcf8574GpioExtenderBoard:

    common_bus_number = 1 # Use bus number 1 for Raspberry Pi 3 and newer

    instances: Dict[int, 'Pcf8574GpioExtenderBoard'] = {}

    logger = None

    @staticmethod
    def set_bus_number(bus_number: int): 
        Pcf8574GpioExtenderBoard.bus_number = bus_number    

    @staticmethod
    def get_board(board: int) -> 'Pcf8574GpioExtenderBoard':

        # Get the board instance from the dictionary or create a new one
        board_instance = Pcf8574GpioExtenderBoard.instances.get(board)
        if not board_instance:
            board_instance = Pcf8574GpioExtenderBoard(i2c_address=board, bus_number=Pcf8574GpioExtenderBoard.common_bus_number)
            Pcf8574GpioExtenderBoard.instances[board] = board_instance
            board_instance.start()
            Pcf8574GpioExtenderBoard.logger.info(f"New Pcf8574GpioExtenderBoard instance created for address: {board}")
        return board_instance

    @staticmethod         
    def read_channel(board: int, channel: int) -> (Optional[str], Optional[bool]):
            
        # Check if the channel is valid
        if channel < 0 or channel > 7:
            return f"In read_limit_switch, Bad channel {channel}", None            

        board_instance = Pcf8574GpioExtenderBoard.get_board(board) 

        # Read the byte for all channels
        byte_value = board_instance.get_input()

        # Extract the value for the specific channel using bit shift logic
        channel_value = (byte_value >> channel) & 0b1
        return None, bool(channel_value)
    
    @staticmethod
    def get_input_for_board(board: int) -> int:
        board_instance = Pcf8574GpioExtenderBoard.get_board(board) 
        return board_instance.get_input();

    @staticmethod
    def stop_all_threads():
        for key, instance in Pcf8574GpioExtenderBoard.instances.items():
            Pcf8574GpioExtenderBoard.logger.info(f"Stopping Pcf8574GpioExtenderBoard 0x{instance.i2c_address::02X} ")
            instance.stop()
            

    def __init__(self, i2c_address: int, refresh_seconds: float = 0.5, bus_number: int = 1):
            self.i2c_address = i2c_address;
            self.bus = SMBus(bus_number)  # Use bus number 1 for Raspberry Pi 3 and newer
            self.running = False
            self.thread = None
            self.refresh_seconds = refresh_seconds
            self.input_value = 0xDEADBEEF # Bad value to aid in debugging startup issues. 
            self.input_lock = threading.Lock()


    def get_input(self) -> int:
        with self.input_lock:
            return self.input_value;     

    # Configure ports for input mode by writing all "1"'s to the addressed device port
    def configure_inputs(self):
        self.bus.write_byte(self.i2c_address, 0xFF)  # set ports high for input mode    

    def read_inputs(self) -> int:
        data_in = self.bus.read_byte(self.i2c_address)
        Pcf8574GpioExtenderBoard.logger.info(f"Data read for address: {self.i2c_address} value: {data_in}")
        return data_in  

    def update_outputs(self, value: int):
        self.bus.write_byte(self.i2c_address, value)              

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop)
            # The thread should be a daemon so it doesn't interfere with Octoprint restarts.
            self.thread.daemon = True 
            self.thread.start()

    def stop(self):
        if self.running:
            self.running = False
            self.thread.join()     

    def _run_loop(self):
        self.configure_inputs();
        while self.running:
            with self.input_lock:    
                self.input_value = self.read_inputs() 
            time.sleep(self.refresh_seconds)            
                             
