from http import HTTPStatus

import json
import os
import flask
import octoprint.plugin
import datetime
from smbus2 import SMBus

from .actuators import Actuators, default_actuators
from .filament_sensors import FilamentSensors
from .pcf8574GpioExtenderBoard import Pcf8574GpioExtenderBoard
from .servo import Servo, default_servo_driver_boards

from .plugin_version import PLUGIN_VERSION


def jsonify_no_cache(status, **kwargs):
    response = flask.jsonify(**kwargs)
    
    # Set appropriate headers to prevent caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return response

class ChromatoforePlugin(
    octoprint.plugin.ShutdownPlugin,  # Doesn't seem to do anything!
    octoprint.plugin.EventHandlerPlugin,
    octoprint.plugin.StartupPlugin,
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.SimpleApiPlugin):

    def __init__(self):
        pass
        self.filament_sensors = FilamentSensors(i2c_address=0x21)
        
    # StartupPlugin mixin         

    def on_after_startup(self):
        self._logger.info("In on_after_startup")
        Pcf8574GpioExtenderBoard.logger = self._logger
        self.actuators = Actuators(self._logger, self._settings.get(["actuators"]));
        self._logger.info(f"self.actuators:\n {self.actuators}")
        self.actuators.dump()
        self._logger.info(f"self.get_plugin_data_folder(): {self.get_plugin_data_folder()}")
  

    # ShutdownPlugin mixin
    # 
    #    

    def on_shutdown(self):
        self._logger.info("In on_shutdown")
        # self.filament_sensors.stop()
        Pcf8574GpioExtenderBoard.stop_all_threads()
        self._logger.info("Leaving on_shutdown") 

    def get_sorting_key(self, context):
        if context == "ShutdownPlugin.on_shutdown":
            return 1
        return None  

    # EventHandlerPlugin mixin
    def on_event(self, event, payload):
        if event == "Shutdown":
           self._logger.info("In on_event, with event == 'Shutdown'")
           self.on_shutdown()


    # Exploratory investigation for slow restart

    def on_plugin_disable(self):
        self._logger.info("In on_plugin_disable")
        self.on_shutdown();
    

    # Simple API Commands mixin:                 

    def get_api_commands(self):
        return {
            "validate_i2c": ["address"],
            "is_filament_sensed": ["pin"],  # For example http://chromatofore.local/api/plugin/chromatofore?command=is_filament_sensed&pin=1
            "read_limit_switch": ["board", "channel"], 
            "shutdown_chromatofore_plugin": [],
            "set_servo_angle": ["board", "channel", "angle"],
            "load_filament":["actuator"],
            "unload_filament":["actuator"],
            "advance_filament":["actuator"], # "stop_at" and "speed" are optional
            "retract_filament":["actuator"], # "stop_at" and "speed" are optional
        }
    
    # Well also define the optional parameters for each command
    def get_api_optional_parameters(self): 
        return {
            "validate_i2c": [],
            "is_filament_sensed": [],
            "read_limit_switch": [],
            "shutdown_chromatofore_plugin": [],
            "set_servo_angle": [],
            "load_filament": ["speed"],
            "unload_filament": ["speed"],
            "advance_filament": ["stop_at", "speed"],
            "retract_filament": ["stop_at", "speed"]
        } 

    def get_parameter_types(self):
        # Define the expected data types for each command and parameter combination
        return {
            ("validate_i2c", "address"): int,
            ("is_filament_sensed", "pin"): int,
            ("read_limit_switch", "board"): int,
            ("read_limit_switch", "channel"): int,
            ("set_servo_angle", "board"): int,
            ("set_servo_angle", "channel"): int,
            ("set_servo_angle", "angle"): int,
            ("unload_filament", "actuator"): str,

            ("unload_filament", "speed"): dict,
            ("advance_filament", "speed"): dict,
            ("advance_filament", "stop_at"): dict,            
            ("retract_filament", "speed"): dict,
            ("retract_filament", "stop_at"): dict,  
        } 
    
    def get_allowed_get_commands(self):
        """Return a list of commands that are allowed as GET requests."""
        return ["is_filament_sensed", "validate_i2c"]    
    
    def handle_commands(self, command, extracted_data):
        # Now handle the specific command actions
        if command == "shutdown_chromatofore_plugin":
            self.on_shutdown()
            return jsonify_no_cache(HTTPStatus.OK, action="Shutting down Chromatofore")
        
        elif command == "validate_i2c":
            try:
                with SMBus(1) as bus:
                    bus.write_quick(extracted_data.get("address"))
                return jsonify_no_cache(HTTPStatus.OK, valid=True)
            except:
                return jsonify_no_cache(HTTPStatus.OK, valid=False, reason="Address not found")
        
        elif command == "is_filament_sensed":
            error_message, sensed = self.filament_sensors.is_filament_sensed(extracted_data.get("pin"))
            if error_message is None:
                return jsonify_no_cache(HTTPStatus.OK, success=True, sensed=sensed)
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message)

        elif command == "set_servo_angle":
            error_message = Servo.set_servo_angle(extracted_data.get("board"), extracted_data.get("channel"), extracted_data.get("angle"))
            if error_message is None:
                return jsonify_no_cache(HTTPStatus.OK, success=True, board=extracted_data.get("board"), channel=extracted_data.get("channel"), angle=extracted_data.get("angle"))
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, board=extracted_data.get("board"), channel=extracted_data.get("channel"), angle=extracted_data.get("angle"))

        elif command == "read_limit_switch":
            error_message, pin_state = Pcf8574GpioExtenderBoard.read_channel(extracted_data.get("board"), extracted_data.get("channel"))
            if error_message:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, board=extracted_data.get("board"), channel=extracted_data.get("channel"))
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=True, board=extracted_data.get("board"), channel=extracted_data.get("channel"), pin_state=pin_state)

        elif command in ["load_filament", "unload_filament", "advance_filament", "retract_filament"]:
            error_message = self.actuators.handle_command(command, extracted_data.get("actuator"), extracted_data.get("stop_at"), extracted_data.get("speed"))
            if error_message is None:
                return jsonify_no_cache(HTTPStatus.OK, success=True, actuator=extracted_data.get("actuator"))
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, actuator=extracted_data.get("actuator"))

        else:
            return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="unknown command", command=command)


    def on_api_command(self, command, data):
        # Extracting the required and optional parameters
        required_parameters = self.get_api_commands().get(command, [])
        optional_parameters = self.get_api_optional_parameters().get(command, [])
        # Check for extraneous keys and log them
        for key in data:
            if key not in required_parameters and key not in optional_parameters and key != "command":
                value = data[key]
                self._logger.warning(f"Unexpected parameter '{key}' with value '{value}' received in data for command '{command}'.")

        # Validate and convert parameters to the expected types
        extracted_data = {}    
        parameter_types = self.get_parameter_types()
        for param, value in data.items():
            expected_type = parameter_types.get((command, param))
            if expected_type:
                if expected_type is int and not isinstance(value, int):
                    try:
                        value = int(value)
                    except ValueError:
                        return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason=f"Invalid {param} parameter: Expected an integer")
                elif expected_type is float and not isinstance(value, float):
                    try:
                        value = float(value)
                    except ValueError:
                        return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason=f"Invalid {param} parameter: Expected a float")
                elif expected_type is dict and not isinstance(value, dict):
                    # Here, we assume that the value could be a serialized JSON string.
                    try:
                        value = json.loads(value)
                    except ValueError:
                        return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason=f"Invalid {param} parameter: Expected a dictionary")
                elif expected_type is not str and not isinstance(value, expected_type):
                    return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason=f"Invalid {param} parameter: Expected a {expected_type.__name__}")
            extracted_data[param] = value

        return self.handle_commands(command, extracted_data)

    def get_api_get_commands(self):
        """Return the commands and their arguments that are allowed for GET requests."""
        allowed_commands = self.get_allowed_get_commands()
        all_commands = self.get_api_commands()
        return {command: all_commands[command] for command in allowed_commands if command in all_commands}     
        
    def on_api_get(self, request):
        command = request.args.get("command")

        # Check if the command is allowed for GET requests
        if command not in self.get_allowed_get_commands():
            return flask.jsonify(self.get_api_get_commands()), HTTPStatus.BAD_REQUEST

        # Retrieve the required and optional arguments for the given command
        required_parameters = self.get_api_commands().get(command, [])
        optional_parameters = self.get_api_optional_parameters().get(command, [])
        
        # Check if the required arguments are present in the request
        missing_parameters = [param for param in required_parameters if not request.args.get(param)]
        if missing_parameters:
            return flask.jsonify(success=False, reason=f"Missing required parameters: {', '.join(missing_parameters)}"), HTTPStatus.BAD_REQUEST

        # Extract all parameters (required + optional) from the request
        data = {param: request.args.get(param) for param in required_parameters + optional_parameters if request.args.get(param)}

        return self.on_api_command(command, data)

    

    ##~~ SettingsPlugin mixin

    def get_settings_defaults(self):
        return {
            "gpio_boards": [0x20, 0x21],
            "servo_driver_boards": default_servo_driver_boards,
            "actuators": default_actuators
        }
    
    def on_settings_save(self, data):
        self._logger.info("In on_settings_save");
        # Figure out structure of data here:
        # self._logger.info(data);
        actuators_data = data.get('actuators') 
        if actuators_data is None:
            self._logger.error("No actuators key found.  Just creating an empty list ")
            self.actuators = Actuators(self._logger, [])
        else:
            self.actuators = Actuators(self._logger, actuators_data)
        # Add or update unique ids on the actuators
        data['actuators'] = self.actuators.to_data()
    
        # Calling the parent class's implementation of on_settings_save
        # This will save the settings.
        super(ChromatoforePlugin, self).on_settings_save(data)
        
        self._logger.info(f" self.actuators:\n {self.actuators}") 

        ##~~ AssetPlugin mixin

    def get_assets(self):
        # Define your plugin's asset files to automatically include in the
        # core UI here.
        return {
            "js": [
                "js/utilities.js", 
                "js/bitsCheckboxesCustomBinding.js",
                "js/limitSwitch.js", 
                "js/servo.js", 
                "js/actuator.js", 
                "js/i2cBoard.js",
                "js/chromatofore.js"
                ],
            "css": ["css/chromatofore.css"],
            "less": ["less/chromatofore.less"]
        }

    ##~~ Softwareupdate hook

    def get_update_information(self):
        # Define the configuration for your plugin to use with the Software Update
        # Plugin here. See https://docs.octoprint.org/en/master/bundledplugins/softwareupdate.html
        # for details.
        return {
            "chromatofore": {
                "displayName": "Chromatofore Plugin",
                "displayVersion": self._plugin_version,

                # version check: github repository
                "type": "github_release",
                "user": "rich-dobbs-13440",
                "repo": "chromatofore-octoprint-plugin",
                "current": self._plugin_version,

                # update method: pip
                "pip": "https://github.com/rich-dobbs-13440/chromatofore-octoprint-plugin/archive/{target_version}.zip",
            }
        }
    
    def get_template_configs(self):
        return [
            {
                "type": "settings",
                "custom_bindings": True,
                "template": "chromatofore_settings.html"
            },
            {
                "type": "tab",
                "custom_bindings": False,
                "template": "chromatofore_tab.html",
            } 
        ]
    
    def get_template_vars(self):
        return {
            "chromatofore_version": PLUGIN_VERSION,
            "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }  
    
    # def get_version(self):
    #     self._logger.info(f"self._identifier: {self._identifier}")
    #     plugin_manager = self._plugin_manager
    #     plugin_info = plugin_manager.get_plugin_info(self._identifier)
    #     return plugin_info.version    

    def store_data(self):
        path = os.path.join(self.get_plugin_data_folder(), "chromatofore_data.json")
        with open(path, 'w') as file:
            json.dump(self.actuators.data_to_store(), file)

    def restore_data(self):
        path = os.path.join(self.get_plugin_data_folder(), "chromatofore_data.json")
        if os.path.exists(path):
            with open(path, 'r') as file:
                data = json.load(file)
                self.actuators.restore_data(data)