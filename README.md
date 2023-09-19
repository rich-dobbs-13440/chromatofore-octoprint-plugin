# OctoPrint plug-in for the Chromatofore Filament Exchanger

**Description:** 

Chromatofore is an affordable automatic filament exchanger tailored for entry-level Bowden 3D printers such as the Creality Ender 3 v2 and CR-6 SE.

This Chromatofore plugin integrates the filament exchanger with the OctoPrint 3D print server running on a Raspberry Pi. The plugin enables users to:
- Specify the configuration of the filament exchanger's electronic components.
- Test the exchanger's functionality and setup.
- Change filaments through the OctoPrint web interface.
- Automatically change filaments during a print job.

This plug-in is in active development and is currently in a pre-release phase, with an initial release planned soon.

## Setup

Install using the bundled [Plugin Manager](https://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html) or manually with this URL:

    https://github.com/rich-dobbs-13440/chromatofore-octoprint-plugin/archive/master.zip

**Installation Note:** Before using the plug-in, 3D print the components for your first actuator from:

    https://github.com/rich-dobbs-13440/chromatofore

Purchase the necessary parts as detailed in the cost calculator worksheet in the repository. Install the plug-in to configure and test the actuator during assembly. Once one or two actuators are operational, print the parts to mount the filament exchanger on your 3D printer. Then, begin using the filament exchanger as you print more actuators and integrate them into the system.

## Configuration

On the settings page, users can specify the assembled configuration of the filament exchanger:

1. For each actuator, define the electronic connections.
2. Specify the I2C board, channel, and min/max angles for each of the three servo motors per actuator.
3. For the two limit switches in each actuator (for jam sensing and filament detection in the printer), define the I2C board and channel.

---


## Development Roadmap

*Outlined below are the features and improvements planned for upcoming Chromatofore versions.*

**Version 0.5**:
   - Completed on 9/4/2023.
   - Configuration options for actuator servos.
   - Servo movement testing.
   - Limit switch configuration.
   - Testing for filament detection and pusher movement using limit switches.

**Version 0.6**: 
   - Completed on 9/11/2023.
   - Scan the I2C bus for boards.  
   - Periodically check the boards for availability.  
   - Display board jumpers.  

**Version 0.7**: 
   - Current focus of efforts.
   - Logic and UI for loading/unloading filaments in the exchanger.
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

## Development History

The Chromatofore plugin is currently at **Version: 0.6.235**. 

### Current Sprint - Start: 9/12/2023 End: 9/17/2023 

Intent: Work on GUI and logic for loading and unloading filament.

The GUI shows buttons for loading, unloading, and stepping foreback or backward.

When loading and unloading filament, the user needs to be able to see progress
as well as cancel the task.  

If opening up multiple browsers, the progress dialog must be shown.  

The progress dialog should be modal within the tab. 

Get rid of explicit delays for servo movements, but sweep at a specified rate
from the current location to target location.  

### Past Sprints

#### Intent: Complete Version 0.6 - Start: 9/4/2023 End:  9/11/2023

Currently, identification of boards is a manual process, but much of it can be automated 
by scanning the I2C bus, and directly display whether the board is detected, rather than
using an alert. 

For controlling the actuators, we need to create server side objects from the settings 
defined for 'actuators'.

Then we need a tab in which the user can interact with each actuator to move filament
as needed to load filament into and out of the filament exchanger and the printer.

These need to be connected by expanding the SimpleApiCommands that are implemented.

Next, start on implementing the logic for moving filament for loading and unloading.

Version 0.6.0 release was achieved, and Version 0.7 features were started.



#### Intent: Complete Version 0.5 - Start: 8/26/2023  End: Start: 9/4/2023   

We are working toward Version 0.5 as described in the Development Roadmap.  Version 0.5 features are
probably complete, but need to be validated and refined.  

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

<!-- 

- **Version b.b (Date)**:
  - Added: New feature or enhancement.
  - Fixed: Bug fixes.
  - Changed: Updates in existing feature.

*(Continue with the list of versions and their respective changes with new entries add a start)*

-->

*This section documents changes for Chromatofore versions.*
- **Version 0.6.107(9/14/2023)**:
     Added: Progress dialog, allowing canceling of loading task.
- **Version 0.6.59 (9/10/2023)**:
     Added: Can trigger loading filament, with the actuator moving the filament until the filament sensor is triggered.
- **Version 0.6.0 (9/10/2023)**:
   - Completion: Version 0.6 features
- **Version 0.5.120 (9/4/2023)**:
   - Added: Server side objects that correspond to the actuator list. Just configuration information. No actions yet.
- **Version 0.5.45 (9/4/2023)**:
   - Added: Scan bus for boards with an address in the range of the specified board type.  
   - Added: Automatically add a board that is found on the bus
- **Version 0.5.34 (9/4/2023)**:
   - Added: Check if board is on bus at startup
   - Changed: Board validation is displayed in table, rather than through an alert.
- **Version 0.5.0 (9/4/2023)**:
     Completion: Version 0.5 features
- **Version 0.4.324 (9/4/2023)**:
     Revised: Development Roadmap to merge version 0.5 and 0.6 features into version 0.5, and created a different 0.6 version.
     Refactored: Moved board list management features out of main plugin class, into I2cBoard.js.
- **Version 0.4.257 (9/3/2023)**:
     Added: Display current board address even if it has been deleted from the list of servo or GPIO boards.  
- **Version 0.4.225 (9/3/2023)**:
     Added: When adding an actuator, start with last defined actuator and increment channels. Use the same board.
- **Version 0.4.218 (9/3/2023)**:
   - Added: Real code for reading limit switch state to support assembly of actuators.
- **Version 0.4.188 (9/2/2023)**:
   - Added: Dummy server-side code for reading limit switch state to support UI development.
   - Added: Client-side code for reading and displaying limit switch state.
- **Version 0.4.159 (9/1/2023)**:
   - Added: CI/CD workflow to update version number in README.md.
- **Version 0.4.148 (9/1/2023)**:
   - Added: Functionality to add or remove actuators.
   - Added: Options to show or hide detailed actuator configurations.   



---

## Backlog

*Below is a list of acknowledged features, enhancements, and bugs, not yet slated for a specific release.*

- Bug: The servo board address list doesn't update correctly when a new board is added.
- Bug: The user can delete a I2C board that is in use.
- Enhancement: Allow specifying board addresses via jumper checkboxes, complementing hexadecimal input.
- Enhancement: Analyze configuration and report potential channel conflicts.
- Enhancement: Require confirmation before deleting an acuator.
- Enhancement: Wizard to guide user through initial configuration, such as how to print out 3d parts, assemble, 
               and get an initial settings for the number of actuators that they are using.  
- Enhancement: Create a log specific to the Chromatofore plugin, to assist in troubleshooting.
- Enhancement: Include display of notes in board selection dropdowns 
- Investigation: Installation on a clean machine, especially how to handle access to I2c, and I2c bus speed.
- Technical Debt: Use ES6 classes and mark variables as public or private.


