# OctoPrint plug-in for the Chromatofore filament changer

**Description:** 

Chromatofore is a low cost automatic filament changer that is targeted at low end Bowden 3d printers such as the Creality Ender 3 v2 or CR-6 SE.

The Chromatofore plugin provides integration of filament changer into the Octoprint 3d print server running on a Raspberry PI. 
This plugin allows the user to specify the configuration of the electronics components of the filament changer, to test that the 
changer is configured and working properly, to change filaments via the Octoprint web interface, and automatically change filament during a print job.

This plug-in is in active development, and is currently at a pre-release stage, working towards an initial release soon.

## Setup

Install via the bundled [Plugin Manager](https://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html)
or manually using this URL:

    https://github.com/rich-dobbs-13440/chromatofore-octoprint-plugin/archive/master.zip

**Installation Note:** Before using the plug-in, you will need to 3d print the components for your first actuator using:

    https://github.com/rich-dobbs-13440/chromatofore

You'll need to buy the parts as described in the costing calculator worksheet in that repository.  Then install the plug-in so that 
you can configure and test the actuator as you assemble it.  Once you've got one or two actuators working, you can then print the 
parts that allow you to install the filament changer on your 3d printer.  After that, you'll be able to start using filament changer 
as you print out the remainder of actuators, and install them into the system.

## Configuration

The settings page allows the user to record the configuration of the filament changer as it has been assembled.

1. For each actuator, you will need to specify the connections of that actuator to the electronics.  
2. Each actuator has 3 servo motors. You'll need to specify the I2C board and channel used for each servo, as well as minimum
   and maximum angles.   
3. Each actuator has two limit switches, one used to sense jams, and one to sense the presense of filament loaded into the printer. 
   You'll need to specify the I2C board and channel used for each limit switch.

---

## Development Roadmap

*The following is a list of features and improvements planned for Chromatofore in the upcoming versions.*

**Version 0.5** : 
   - Configure the servos for an actuator.
   - Test servo movement

**Version 0.6**: 
   - Configure limit switches
   - Test limit switches for filament detection and for pusher movement.

**Version 0.7**: 
   - Implement logic and UI for loading filament into the changer.
   - Implement logic and UI for unloading filament from the changer.
   - Implement logic and UI for unloading filament from the 3d printer.
   - Implement logic and UI for loading filament from the 3d printer.

**Version 0.8**: 
   - Implement logic for changing filament in response to a filament change event in gcode.
   - Understand how to modify gcode to cause filament change events to be triggered.

**Version 0.9**: 
   - Implement logic for detecting filament jams during loading
   - Implement logic for detecting filament jams during removing filament from printer.

**Version 0.10**: 
   - Identify and resolve remaining needed features for Minimum Viable Product release.

**Version 1.00**:
   - Initial public release of Minimum Viable Product.
   - Plan documentation and publication efforts.
---

## Change Log

*This section documents the changes made in each version of Chromatofore.*

- **Version 0.4.148 (9/1/2023)**:
  - Added: Ability to add or remove actuators.
  - Added: Ability to show or hide detailed configuration of each actuator.

<!-- 

- **Version b.b (Date)**:
  - Added: New feature or enhancement.
  - Fixed: Bug fixes.
  - Changed: Changes in existing feature.

*(Continue listing down the versions and their respective changes.)*

-->

---

## Backlog

*The following is a list of features, enhancements, and bug fixes that are acknowledged but not yet scheduled for a specific release.*

- Bug:  The list of board addresses for the servos is not correctly updated when a new board is added.
- Enhancement: Specify board addresses using jumper checkboxes, as a supplement to hexidecimal input.


