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

**Installation Note:** Before using the plug-in, you will need to 3d print the components using:

    https://github.com/rich-dobbs-13440/chromatofore

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

1. **Version x.x**: 
   - Feature or improvement 1.
   - Feature or improvement 2.
   - ... *(and so on)*

2. **Version y.y**: 
   - Feature or improvement 1.
   - Feature or improvement 2.
   - ... *(and so on)*

*(Continue listing down the planned versions and their features/improvements.)*

---

## Change Log

*This section documents the changes made in each version of Chromatofore.*

- **Version a.a (Date)**:
  - Added: New feature or enhancement.
  - Fixed: Bug fixes.
  - Changed: Changes in existing feature.

- **Version b.b (Date)**:
  - Added: New feature or enhancement.
  - Fixed: Bug fixes.
  - Changed: Changes in existing feature.

*(Continue listing down the versions and their respective changes.)*

---

## Backlog

*The following is a list of features, enhancements, and bug fixes that are acknowledged but not yet scheduled for a specific release.*

- Bug:  The list of board addresses for the servos is not correctly updated when a new board is added.
- Bug that needs fixing.
- Another enhancement.
- ... *(and so on)*

*(Continue listing down the items in the backlog.)*
