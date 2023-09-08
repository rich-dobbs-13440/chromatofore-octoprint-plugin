from http import HTTPStatus

import flask
import octoprint.plugin
import datetime
from smbus2 import SMBus

from .actuators import Actuators, default_actuators
from .filament_sensors import FilamentSensors
from .pcf8574GpioExtenderBoard import Pcf8574GpioExtenderBoard
from .servo import Servo, default_servo_driver_boards


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
        self._logger.info(f" self.actuators:\n {self.actuators}")
        self.actuators.dump()
  

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
            "advance_filament":["actuator", "stop_at", "speed"],
            "retract_filament":["actuator", "stop_at", "speed"] 
        }
    
    def on_api_command(self, command, data):
        if command == "shutdown_chromatofore_plugin":
            self.on_shutdown()
            return jsonify_no_cache(HTTPStatus.OK, action="Shutting down Chromatofore")  
        elif command == "validate_i2c":
            self._logger.info("In command validate_i2c")
            address = data.get("address")
            if address is None:
                # return flask.jsonify(valid=False, reason="Invalid address")
                return jsonify_no_cache(HTTPStatus.OK, valid=False, reason="Invalid address")
            try:
                with SMBus(1) as bus:  # 1 is the I2C bus number, adjust if needed
                    # Simple check, adjust based on your board specifics
                    bus.write_quick(address)
                # return flask.jsonify(valid=True)
                return jsonify_no_cache(HTTPStatus.OK, valid=True)
            except:
                return jsonify_no_cache(HTTPStatus.OK, valid=False, reason="Address not found")   
        elif command == "is_filament_sensed":
            self._logger.info(f"In command is_filament_sensed: {self.filament_sensors.get_input():08b}")
            pin_str = data.get("pin")
            if pin_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing pin parameter")
            try:
                pin = int(pin_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid pin parameter"), 
        
            error_message, sensed = self.filament_sensors.is_filament_sensed(pin)

            if error_message is None:
                return jsonify_no_cache(HTTPStatus.OK, success=True, sensed=sensed)
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message)
        
        elif command == "set_servo_angle":
           
            board_str = data.get("board")
            if board_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing board parameter")
            try:
                board = int(board_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid board parameter", board=board_str)

            channel_str = data.get("channel")
            if channel_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing channel parameter")
            try:
                channel = int(channel_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid channel parameter", channel=channel_str)
            
            angle_str = data.get("angle")
            if angle_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing angle parameter")
            try:
                angle = int(angle_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid angle parameter", angle=angle_str)

            error_message = Servo.set_servo_angle(board, channel, angle) 
            if error_message is None: 
                return jsonify_no_cache(HTTPStatus.OK, success=True, board=board_str, channel=channel_str, angle=angle_str)
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, board=board_str, channel=channel_str, angle=angle_str)
            
        elif command == "read_limit_switch":
            self._logger.info("In command read_limit_switch")

            # Process board parameter
            board_str = data.get("board")
            if board_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing board parameter")
            try:
                board = int(board_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid board parameter", board=board_str)

            # Process channel parameter
            channel_str = data.get("channel")
            if channel_str is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing channel parameter")
            try:
                channel = int(channel_str)
            except ValueError:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Invalid channel parameter", channel=channel_str)
            
            self._logger.info("Calling Pcf8574GpioExtenderBoard.read_channel")  
            self._logger.info(f"In command read_limit_switch: {Pcf8574GpioExtenderBoard.get_input_for_board(board):08b}")

            error_message, pin_state = Pcf8574GpioExtenderBoard.read_channel(board, channel)
            self._logger.info(f"Error message: {error_message} pin_state {pin_state}")

            if error_message:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, board=board, channel=channel)
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=True, board=board_str, channel=channel, pin_state=pin_state)

        elif command in ["load_filament", "unload_filament", "advance_filament", "retract_filament"]:
            actuator_value = data.get("actuator")
            if actuator_value is None:
                return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="Missing actuator parameter")

            # As you said, other parameters are optional, I'll get them without validation for now.
            stop_at = data.get("stop_at", None)
            speed = data.get("speed", None)
            
            # Forwarding the request to the actuators handler. I'm assuming it returns an error message if something goes wrong.
            error_message = self.actuators.handle_command(command, actuator_value, stop_at, speed)

            if error_message is None:
                return jsonify_no_cache(HTTPStatus.OK, success=True, actuator=actuator_value)
            else:
                return jsonify_no_cache(HTTPStatus.OK, success=False, reason=error_message, actuator=actuator_value)

        else:
            return jsonify_no_cache(HTTPStatus.BAD_REQUEST, success=False, reason="unknown command", command=command)

        
    def on_api_get(self, request):
        command = request.args.get("command")
        if command == "is_filament_sensed":
            pin = request.args.get("pin")
            return self.on_api_command(command, {"pin": pin})
        elif command == "validate_i2c":
            address = request.args.get("address")
            return self.on_api_command(command, {"address": address})
        else:
            return flask.jsonify(self.get_api_commands())


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
            self._logger.error("No actuators key found.  Just creatin an empty list ")
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
            "ss_actuators": self.actuators,
            "current_time": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}    
    