from typing import Optional

class Pcf9574GpioExtenderBoard:
    @staticmethod
    def read_limit_switch(board:int, channel:int) -> (Optional[str], Optional[bool]):
            if channel == 0:
                  return None, True
            elif channel == 1:
                  return None, False
            else:
                  return f"In read_limit_switch, Bad channel{channel}", None
