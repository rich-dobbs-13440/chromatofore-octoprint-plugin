# from time import sleep, perf_counter
from typing import Any, Dict, Optional, Callable
import logging
import threading
import time

from .servo import Servo


class ReleaseLever:
    def __init__(self, logger: logging.Logger, data: Dict[str, Any]):
        # TODO:  May need to know what model of release lever automator is being used.
        self.logger = logger
        self.logger.info(f"In ReleaseLever.__init__: data: {data}")
        self.servo = Servo(data.get("servo"))
        self.release_position = 1
        self.engage_position = 0

    def wait_then_rest(self):
        # Under no circumstances, should it take more than 5 seconds 
        # for the servo to reach the desired position if it ever
        # is going to.
        time.sleep(5)
        # TODO:  Add in checks to see if servo actually reached
        # the desired position.
        # In case if the servo is blocked, we don't want it to keep 
        # trying to seek the position.  This could destroy the servo
        # if it is blocked.  So stop seeking
        self.servo.at_rest = True           

    def release(self):
        self.logger.info("Got to release command in ReleaseLever")
        self.servo.position = self.release_position
        thread = threading.Thread(target=self.wait_then_rest)
        thread.start()

    def engage(self):
        self.logger.info("Got to engage command in ReleaseLever")
        self.servo.position = self.engage_position
        thread = threading.Thread(target=self.wait_then_rest)
        thread.start()



default_release_lever = {
    "model": "wrasse",
    "servo": {"role": "Release Servo", "board": 0x40, "channel": 0xF, "min_angle":15, "max_angle":165},
}
     