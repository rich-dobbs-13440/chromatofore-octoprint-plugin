
from .pcf8574_gpio_extender_board import Pcf8574GpioExtenderBoard

class LimitSwitchRuntimeError(RuntimeError):
    """Exception raised for runtime errors in the Servo class."""
    def __init__(self, message: str, original_exception: Exception = None):
        self.original_exception = original_exception
        message = f"{messge} Original exception:  {self.original_exception}"
        super().__init__(message)

class LimitSwitch:
    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.role = data.get("role")
        self.is_normally_open = data.get("is_normally_open", False)


    def to_data(self):
        return {
            'board': self.board,
            'channel': self.channel,
            'role': self.role
        }
    
    def is_triggered(self) -> bool:
        try:
            pin_is_high = Pcf8574GpioExtenderBoard.read_channel(self.board, self.channel)
            return pin_is_high == self.is_normally_open
        except RuntimeError as e:
            error_message = f"In limit switch {str(self)} a runtime error occurred."
            raise LimitSwitchRuntimeError(error_message, e)


    def __str__(self):
        board = f"0x{self.board:02X}" if  isinstance(self.board, int) else f"{self.board}"
        return f"LimitSwitch(Role: {self.role}, Board: {board}, Channel: {self.channel})"


    def __repr__(self):
        board = f"0x{self.board:02X}" if  isinstance(self.board, int) else f"{self.board}"
        return f"LimitSwitch(data={{'board': board, 'channel': {self.channel}, 'role': {repr(self.role)}}})"
    