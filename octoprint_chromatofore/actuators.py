
from time import sleep, perf_counter
from typing import Any, Dict, Optional
import logging

from .filament_sensors import FilamentSensor
from .limit_switch import LimitSwitch
from .servo import Servo

_logger = logging.getLogger('Actuator Logger')
_logger.addHandler(logging.NullHandler())


default_actuators = [
    {
        "id": "black_wire",
        "pusher": {"role": "Pusher Servo", "board": 0x40, "channel": 0x0, "min_angle":0, "max_angle":180},
        "moving_clamp": {"role": "Moving Clamp Servo", "board": 0x40, "channel": 0x1, "min_angle":0, "max_angle":180},
        "fixed_clamp": {"role": "Fixed Clamp Servo", "board": 0x40, "channel": 0x2, "min_angle":0, "max_angle":180},
        "pusher_limit_switch": {"board": 0x20, "channel": 0x0},
        "filament_sensor": {"board": 0x21, "channel": 0x0},
    },
]

# Constants for servo positions and delays
OPEN = 0
CLOSED = 1
BACK = 1
FRONT = 0
CLAMP_DELAY_SECONDS = 0.9
PUSHER_DELAY_SECONDS = 1.5



class Actuator:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")    # Need to rename - this is a nickname, not the id    

        self.fixed_clamp = Servo(data.get("fixed_clamp"))
        self.moving_clamp = Servo(data.get("moving_clamp"))
        self.pusher = Servo(data.get("pusher"))
        self.pusher_limit_switch = LimitSwitch(data.get("pusher_limit_switch"))
        self.filament_sensor = FilamentSensor(data.get("filament_sensor")) 
        self.hash_code =  data.get("hash_code", "-- hash code_ missing -- ")

        self.step_length_in_mm = 30
        self.time_step_seconds = 0.025

        slow_step_time = 4
        moderate_step_time = 1
        brisk_step_time = 0.5
        quick_step_time = 0.25

        self.qualitative_speed_to_mm_per_second = {
            'slow': self.step_length_in_mm/slow_step_time, 
            'moderate': self.step_length_in_mm/moderate_step_time,
            'brisk': self.step_length_in_mm/brisk_step_time,
            'quick': self.step_length_in_mm/quick_step_time,
        }



    def __str__(self):
        return "Actuator " \
            f"\n   ID: {self.id}," \
            f"\n   Filament Sensor: {self.filament_sensor}, " \
            f"\n   Fixed Clamp: {self.fixed_clamp}," \
            f"\n   Moving Clamp: {self.moving_clamp}, " \
            f"\n   Pusher: {self.pusher}, " \
            f"\n   Pusher Limit Switch: {self.pusher_limit_switch}"

    def __repr__(self):
        return (
            f"Actuator(data={{"
            f"'id': {repr(self.id)}, "
            f"'filament_sensor': {repr(self.filament_sensor)}, "
            f"'fixed_clamp': {repr(self.fixed_clamp)}, "
            f"'moving_clamp': {repr(self.moving_clamp)}, "
            f"'pusher': {repr(self.pusher)}, "
            f"'pusher_limit_switch': {repr(self.pusher_limit_switch)}"
            f"}})"
            )        
    
    def to_data(self):
        return {
            'id': self.id,
            'fixed_clamp': self.fixed_clamp.to_data(),
            'moving_clamp': self.moving_clamp.to_data(),
            'pusher': self.pusher.to_data(),
            'pusher_limit_switch': self.pusher_limit_switch.to_data(),
            'filament_sensor': self.filament_sensor.to_data(),
            'hash_code': self.hash_code
        }


    def load_filament(self, speed: Optional[Dict] = None) -> None:
        """
        Method for loading filament into the actuator.
        """
        _logger.info(f"Loading filament for actuator with hash {self.hash_code}")
        self.task_load_filament(speed)

    def task_load_filament(self, speed: Optional[Dict] = None) -> None:
        """
        Task method that handles the actual loading of the filament.
        """
        # Your loading logic here
        pass

    def unload_filament(self, speed: Optional[Dict] = None) -> None:
        """
        Method for unloading filament from the actuator.
        """
        _logger.info(f"Unloading filament for actuator with hash {self.hash_code}")
        self.task_unload_filament(speed)

    def task_unload_filament(self, speed: Optional[Dict] = None) -> None:
        """
        Task method that handles the actual unloading of the filament.
        """
        # Your unloading logic here
        pass



    def advance_filament(self, stop_at: Optional[Dict] = None, speed: Optional[Dict] = None) -> None:
        _logger.info(f"Advancing filament for actuator with hash {self.hash_code}, stopping at {stop_at} with speed {speed}")
        self.task_advance_filament(stop_at, speed)

    def task_advance_filament(self, stop_at: Optional[Dict] = None, speed: Optional[Dict] = None) -> None:
        # Default to one step if "step" is not provided in stop_at
        steps = 1
        
        if stop_at and "step" in stop_at:
            try:
                steps = int(stop_at["step"])
            except ValueError:
                _logger.error("Invalid step value provided in stop_at.")
                return
        
        for _ in range(steps):
            self.task_advance_filament_one_step(stop_at=stop_at, speed=speed)    

    
    def rate_from_speed(self, speed: Optional[Dict] = None) -> float:

        if speed is None:
            speed = {}

        qualitative_speed = speed.get("qualitive", "quick")
        try:
            mm_per_second = self.qualitative_speed_to_mm_per_second[qualitative_speed]
        except KeyError:
            raise ValueError(f"Unknown qualitative speed value: {qualitative_speed} speed: {speed}")

        # Attempt to override with quantitative speed if it exists
        try:
            quantitative_speed = speed.get("quantitative")
            if quantitative_speed is not None:
                mm_per_second = float(quantitative_speed)
        except ValueError:
            raise ValueError(f"Invalid quantitative speed value: {quantitative_speed} speed: {speed}")

        return mm_per_second

    
    def calc_position_from_location(self, location_mm):
        position = location_mm/self.step_length_in_mm # Front is 0, back is 0
        return max(min(position, BACK), FRONT)
    
    def calc_location_from_position(self, position):
        # Location is measured from front to back.  
        # The position must be between  the front and the back
        position = max(min(position, BACK), FRONT)
        location = position * self.step_length_in_mm
        return location
    
    def next_position(self, rate_in_mm_per_sec, start_position, end_position):
        start_time = perf_counter()
        start_mm = self.calc_location_from_position(start_position)
        end_mm = self.calc_location_from_position(end_position)
        end_time = start_time + abs(end_mm - start_mm) / rate_in_mm_per_sec
        direction = 1 if end_mm > start_mm else -1

        def mm_at_time(t):
            elapsed_time = t - start_time
            distance_moved = elapsed_time * rate_in_mm_per_sec
            return start_mm + direction * distance_moved

        current_time = start_time
        while current_time < end_time:
            yield self.calc_position_from_location(mm_at_time(current_time))
            current_time = perf_counter()

        yield self.calc_position_from_location(end_mm)


    def task_advance_filament_one_step(self, stop_at: Optional[Dict] = None, speed: Optional[Dict] = None):

        rate_in_mm_per_sec = self.rate_from_speed(speed)       

        # Ignore stop_at for now.

        # Lock the filament so that the pusher can pull back
        self.fixed_clamp.position = CLOSED
        sleep(CLAMP_DELAY_SECONDS)
        self.moving_clamp.position = OPEN
        sleep(CLAMP_DELAY_SECONDS)
        
        # Retract the pusher
        self.pusher.position = BACK
        sleep(PUSHER_DELAY_SECONDS)
        
        # Lock the filament so that the pusher advance filament
        self.fixed_clamp.position = OPEN
        sleep(CLAMP_DELAY_SECONDS)
        self.moving_clamp.position = CLOSED
        sleep(CLAMP_DELAY_SECONDS)

        # Advance the filament at the desired rate
        _logger.info(f"Advance the filament at the desired rate: {rate_in_mm_per_sec} mm/sec, from speed: {speed}")
        for position in self.next_position(rate_in_mm_per_sec, BACK, FRONT):
            _logger.debug(position)
            self.pusher.position = position
            sleep(self.time_step_seconds)
            if self.pusher_limit_switch.is_triggered():
                _logger.warning("Limit switch triggered! Stopping filament advance.")
                break


        # Open up clamp in preparation for next step
        self.moving_clamp.position = OPEN  
        sleep(CLAMP_DELAY_SECONDS)

        # Rest all of the servos, so that they don't chatter and strain. 
        self.pusher.at_rest = True
        self.moving_clamp.at_rest = True
        self.fixed_clamp.at_rest = True

    def retract_filament(self, stop_at: Optional[Dict] = None, speed: Optional[Dict] = None) -> None:
        _logger.info(f"Retracting filament for actuator with hash {self.hash_code}, stopping at {stop_at} with speed {speed}")
        self.task_retract_filament(stop_at, speed)

    def task_retract_filament(self, stop_at: Optional[Dict] = None, speed: Optional[Dict] = None) -> None:
        # Your retracting logic here
        pass


  
class Actuators:
    def __init__(self, logger, actuators_data):
        global _logger
        _logger = logger
        self.items = [Actuator(data) for data in actuators_data]
        self.filament_in_printer = None

    def __iter__(self):
        return iter(self.items)        


    def __str__(self):
        return "\n".join(str(actuator) for actuator in self.items)
    
    def hash_codes_str(self):
        return "\n      ".join(f"'{actuator.hash_code}'" for actuator in self.items)

    def handle_command(self, command, hash_code, stop_at=None, speed=None):
        _logger.info(f"In handle_command with command: {command}  hash_code: {hash_code} stop_at: {stop_at}, speed: {speed}")
        # Searching for the actuator
        target_actuator = None
        for actuator in self.items:
            if actuator.hash_code == hash_code:
                target_actuator = actuator
                break

        if target_actuator is None:
            error_msg = (
                f"No actuator found with hash_code '{hash_code}'.\n "
                f"  Type of hash_code: {type(hash_code)}"
                f"  Possible hash_codes: {self.hash_codes_str()}"
            )
            _logger.warning(error_msg)           
            return error_msg

        if command == "load_filament":
            target_actuator.load_filament()
        elif command == "unload_filament":
            target_actuator.unload_filament()
        elif command == "advance_filament":
            _logger.info(f"Calling advance_filament with stop_at: {stop_at}, speed: {speed}")
            target_actuator.advance_filament(stop_at=stop_at, speed=speed)
        elif command == "retract_filament":
            target_actuator.retract_filament(stop_at=stop_at, speed=speed)
        else:
            # Unknown command
            return f"Unknown command {command}"

        # If everything goes well
        return None
    
    def to_data(self):
        return [actuator.to_data() for actuator in self.items]
    
            
    
    def dump(self):
        for actuator in self.items:
            _logger.info(f"Actuator Identifier: {actuator.hash_code}") 

    def data_to_store(self) -> Dict[str, Any]: 
        return {
            'filament_in_printer': self.filament_in_printer
        }
    
    def restore_data(self, data: Dict[str, Any]) -> None:
        self.filament_in_printer = data.get('filament_in_printer')
 
