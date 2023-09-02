# OctoPrint plug-in for the Chromatofore Filament Changer

**Description:** 

Chromatofore is an affordable automatic filament changer tailored for entry-level Bowden 3D printers such as the Creality Ender 3 v2 and CR-6 SE.

This Chromatofore plugin integrates the filament changer with the OctoPrint 3D print server running on a Raspberry Pi. The plugin enables users to:
- Specify the configuration of the filament changer's electronic components.
- Test the changer's functionality and setup.
- Change filaments through the OctoPrint web interface.
- Automatically change filaments during a print job.

This plug-in is in active development and is currently in a pre-release phase, with an initial release planned soon.

## Setup

Install using the bundled [Plugin Manager](https://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html) or manually with this URL:

    https://github.com/rich-dobbs-13440/chromatofore-octoprint-plugin/archive/master.zip

**Installation Note:** Before using the plug-in, 3D print the components for your first actuator from:

    https://github.com/rich-dobbs-13440/chromatofore

Purchase the necessary parts as detailed in the cost calculator worksheet in the repository. Install the plug-in to configure and test the actuator during assembly. Once one or two actuators are operational, print the parts to mount the filament changer on your 3D printer. Then, begin using the filament changer as you print more actuators and integrate them into the system.

## Configuration

On the settings page, users can specify the assembled configuration of the filament changer:

1. For each actuator, define the electronic connections.
2. Specify the I2C board, channel, and min/max angles for each of the three servo motors per actuator.
3. For the two limit switches in each actuator (for jam sensing and filament detection in the printer), define the I2C board and channel.

---


## Development Roadmap

*Outlined below are the features and improvements planned for upcoming Chromatofore versions.*

**Version 0.5** : 
   - Configuration options for actuator servos.
   - Servo movement testing.

**Version 0.6**: 
   - Limit switch configuration.
   - Testing for filament detection and pusher movement using limit switches.

**Version 0.7**: 
   - Logic and UI for loading/unloading filaments in the changer.
   - Logic and UI for loading/unloading filaments in the 3D printer.

**Version 0.8**: 
   - Logic for automated filament changes triggered by gcode events.
   - Guidance on modifying gcode for triggering filament change events.

**Version 0.9**: 
   - Logic for detecting filament jams during loading.
   - Logic for detecting jams when removing filament from the printer.

**Version 0.10**: 
   - Finalize features for the Minimum Viable Product (MVP) release.

**Version 1.00**:
   - Initial public MVP release.
   - Planning for documentation and publication.

---

## Current Sprint

THe Chromatofore plugin is currently at **Current Version: {{CURRENT_VERSION}}**. 

We are working toward Version 0.5 as described in the Development Roadmap.  Version 0.5 features are
probably complete, but need to be validated and refined.  To aid in validating 0.5, we'll make the initial 
implementation of 0.6 features.  

The next step is implement code to read the limit switches and display their status in the settings dialog.  
This will allow the user to test the limit switches, and correctly set the minimum and maximum angles
for the servos.

For the filament sensor, the end user can insert
or remove filament, and see if this is properly detected by the plugin.  
If the plugin does not respond appropriately, this might be because of 
mechanical or electronic issues with the filament sensor. Mechanical issues
will probably drive refinement of the 3d printed parts.  Electronics issues
might require futzing with the assembly, refining the 3d printed parts and reprinting, or
lead to creating an custom PCB to make the electronics assembly faster and more
reliable.

For the pusher limit switch, the user can position the pusher servo to trigger or 
release the limit switch. This allows the user to verify that the limit switch is
operating properly, and if it is, to adjust the length of the pusher linkage and the 
minimum angle of the pusher servo.  Identified issues will require the same sort of 
approaches as used with the filament sensor.





## Change Log

*This section documents changes for Chromatofore versions.*

- **Version 0.4.148 (9/1/2023)**:
  - Added: Functionality to add or remove actuators.
  - Added: Options to show or hide detailed actuator configurations.
- **Version 0.4.159 (9/1/2023)**:
  - Added: CI/CD workflow to update version number in README.md.
- **Version 0.4.188 (9/2/2023)**:
  - Added: Dummy server-side code for reading limit switch state to support UI development.
  - Added: Client-side code for reading and displaying limit switch state.


<!-- 

- **Version b.b (Date)**:
  - Added: New feature or enhancement.
  - Fixed: Bug fixes.
  - Changed: Updates in existing feature.

*(Continue with the list of versions and their respective changes.)*

-->

---

## Backlog

*Below is a list of acknowledged features, enhancements, and bugs, not yet slated for a specific release.*

- Bug: The servo board address list doesn't update correctly when a new board is added.
- Enhancement: Allow specifying board addresses via jumper checkboxes, complementing hexadecimal input.
- Enhancement: When adding an actuator, start with last defined actuator and increment channels.
- Enhancement: Analyze configuration and report potential channel conflicts.
- Technical Debt: Code for managing boards is duplicated between GPIO and PMW boards


