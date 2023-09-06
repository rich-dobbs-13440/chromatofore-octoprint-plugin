
from .filament_sensors import FilamentSensor
from .limit_switch import LimitSwitch
from .servo import Servo

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

# Assume the other classes (FilamentSensor, Servo, LimitSwitch) also have appropriate __str__ and __repr__ methods.


class Actuators:
    def __init__(self, actuators_data):
        self.actuators = [Actuator(data) for data in actuators_data]

    def __str__(self):
        return "\n".join(str(actuator) for actuator in self.actuators)        