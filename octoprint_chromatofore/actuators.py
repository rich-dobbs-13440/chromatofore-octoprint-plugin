
from .filament_sensors import FilamentSensor
from .limit_switch import LimitSwitch
from .servo import Servo

_logger = None

class Actuator:
    def __init__(self, data):
        self.id = data.get("id")        
        self.filament_sensor = FilamentSensor(data.get("filament_sensor"))
        self.fixed_clamp = Servo(data.get("fixed_clamp"))

        self.moving_clamp = Servo(data.get("moving_clamp"))
        self.pusher = Servo(data.get("pusher"))
        self.pusher_limit_switch = LimitSwitch(data.get("pusher_limit_switch"))


class Actuator:
    def __init__(self, data):
        self.id = data.get("id")        

        self.fixed_clamp = Servo(data.get("fixed_clamp"))
        self.moving_clamp = Servo(data.get("moving_clamp"))
        self.pusher = Servo(data.get("pusher"))
        self.pusher_limit_switch = LimitSwitch(data.get("pusher_limit_switch"))
        self.filament_sensor = FilamentSensor(data.get("filament_sensor"))        

    def __str__(self):
        return "Actuator " \
            f"\n   ID: {self.id}," \
            f"\n   Filament Sensor: {self.filament_sensor}, " \
            f"\n   Fixed Clamp: {self.fixed_clamp}," \
            f"\n   Moving Clamp: {self.moving_clamp}, " \
            f"\n   Pusher: {self.pusher}, " \
            f"\n   Pusher Limit Switch: {self.pusher_limit_switch}"

    def __repr__(self):
        return f"Actuator(data={{'id': {repr(self.id)}, 'filament_sensor': {repr(self.filament_sensor)}, " \
               f"'fixed_clamp': {repr(self.fixed_clamp)}, 'moving_clamp': {repr(self.moving_clamp)}, " \
               f"'pusher': {repr(self.pusher)}, 'pusher_limit_switch': {repr(self.pusher_limit_switch)}}})"
    
    def unique_hash(self):
        essential_data = (
            self.filament_sensor.unique_hash(), 
            self.fixed_clamp.unique_hash(), 
            self.moving_clamp.unique_hash(), 
            self.pusher_limit_switch.unique_hash())
        return f"{abs(hash(essential_data)):8x}"
    
    def load_filament(self) -> None:
        """
        Stub method for loading filament into the actuator.
        """
        _logger.info(f"Loading filament for actuator with hash {self.unique_hash()}")
        # Actual loading logic here

    def unload_filament(self) -> None:
        """
        Stub method for unloading filament from the actuator.
        """
        _logger.info(f"Unloading filament for actuator with hash {self.unique_hash()}")
        # Actual unloading logic here

    def advance_filament(self, stop_at: int, speed: int) -> None:
        """
        Stub method for advancing filament using the actuator.
        """
        _logger.info(f"Advancing filament for actuator with hash {self.unique_hash()}, stopping at {stop_at} with speed {speed}")
        # Actual advancing logic here

    def retract_filament(self, stop_at: int, speed: int) -> None:
        """
        Stub method for retracting filament using the actuator.
        """
        _logger.info(f"Retracting filament for actuator with hash {self.unique_hash()}, stopping at {stop_at} with speed {speed}")
        # Actual retracting logic here    



  
class Actuators:
    def __init__(self, logger, actuators_data):
        global _logger
        _logger = logger
        self.items = [Actuator(data) for data in actuators_data]

        self.fred = "Fred"

    def __iter__(self):
        return iter(self.items)        


    def __str__(self):
        return "\n".join(str(actuator) for actuator in self.items)

    def handle_command(self, command, actuator_value, stop_at=None, speed=None):
        # Searching for the actuator
        target_actuator = None
        for actuator in self.items:
            if actuator.unique_hash() == actuator_value:
                target_actuator = actuator
                break

        if target_actuator is None:
            return f"No actuator found with identifier {actuator_value}"

        if command == "load_filament":
            target_actuator.load_filament()
        elif command == "unload_filament":
            target_actuator.unload_filament()
        elif command == "advance_filament":
            target_actuator.advance_filament(stop_at=stop_at, speed=speed)
        elif command == "retract_filament":
            target_actuator.retract_filament(stop_at=stop_at, speed=speed)
        else:
            # Unknown command
            return f"Unknown command {command}"

        # If everything goes well
        return None
    
    def dump(self):
        for actuator in self.items:
            _logger.info(f"Actuator Identifier: {actuator.unique_hash()}")    
