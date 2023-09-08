
from .filament_sensors import FilamentSensor
from .limit_switch import LimitSwitch
from .servo import Servo

_logger = None


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



class Actuator:
    def __init__(self, data):
        self.id = data.get("id")    # Need to rename - this is a nickname, not the id    

        self.fixed_clamp = Servo(data.get("fixed_clamp"))
        self.moving_clamp = Servo(data.get("moving_clamp"))
        self.pusher = Servo(data.get("pusher"))
        self.pusher_limit_switch = LimitSwitch(data.get("pusher_limit_switch"))
        self.filament_sensor = FilamentSensor(data.get("filament_sensor")) 
        self.essential_id = self.unique_hash()   



    def __str__(self):
        return "Actuator " \
            f"\n   Essential ID: {self.essential_id}," \
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
    
    def unique_hash(self):
        essential_data = (
            self.filament_sensor.unique_hash(), 
            self.fixed_clamp.unique_hash(), 
            self.moving_clamp.unique_hash(), 
            self.pusher_limit_switch.unique_hash())
        return f"{hash(essential_data):8x}"[-8:] # slice to remove possible negative sign
    
    def to_data(self):
        return {
            'id': self.id,
            'fixed_clamp': self.fixed_clamp.to_data(),
            'moving_clamp': self.moving_clamp.to_data(),
            'pusher': self.pusher.to_data(),
            'pusher_limit_switch': self.pusher_limit_switch.to_data(),
            'filament_sensor': self.filament_sensor.to_data(),
            'essential_id': self.essential_id
        }

    
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

    def __iter__(self):
        return iter(self.items)        


    def __str__(self):
        return "\n".join(str(actuator) for actuator in self.items)
    
    def essential_ids_str(self):
        return "\n      ".join(f"'{actuator.essential_id}'" for actuator in self.items)

    def handle_command(self, command, actuator_value, stop_at=None, speed=None):
        # Searching for the actuator
        target_actuator = None
        for actuator in self.items:
            if actuator.essential_id == actuator_value:
                target_actuator = actuator
                break

        if target_actuator is None:
            error_msg = (
                f"No actuator found with identifier '{actuator_value}'.\n "
                f"  Actuator type: {type(actuator_value)}"
                f"  Essential Ids: {self.essential_ids_str()}"
            )
            _logger.warning(error_msg)           
            return error_msg

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
    
    def to_data(self):
        return [actuator.to_data() for actuator in self.items]
    
            
    
    def dump(self):
        for actuator in self.items:
            _logger.info(f"Actuator Identifier: {actuator.unique_hash()}")    
