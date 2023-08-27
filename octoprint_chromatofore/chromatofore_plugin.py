import octoprint.plugin
from smbus2 import SMBus
import flask

class ChromatoforePlugin(
    octoprint.plugin.StartupPlugin,
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.SimpleApiPlugin):

    def get_api_commands(self):
        return {
            "validate_i2c": ["address"]
        }

    def on_api_command(self, command, data):
        if command == "validate_i2c":
            self._logger.info("In command validate_i2c")
            address = data.get("address")
            if address is None:
                return flask.jsonify(valid=False, reason="Invalid address")
            
            try:
                with SMBus(1) as bus:  # 1 is the I2C bus number, adjust if needed
                    # Simple check, adjust based on your board specifics
                    bus.write_quick(address)
                return flask.jsonify(valid=True)
            except:
                return flask.jsonify(valid=False, reason="Communication error")    
        
    

    ##~~ SettingsPlugin mixin

    def get_settings_defaults(self):
        return {
            "gpio_boards": [0x20, 0x21, 0x22, 0x23, 0x24],
            "servo_driver_boards": [],
            "actuators": []
        }

    ##~~ AssetPlugin mixin

    def get_assets(self):
        # Define your plugin's asset files to automatically include in the
        # core UI here.
        return {
            "js": ["js/chromatofore.js"],
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
                "template": "chromatofore_settings.jinja2"
            }
        ]        