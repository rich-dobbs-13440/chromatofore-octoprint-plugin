

# Developer Notes

## Octopi Configuration

The development configuration is hard-coded in deploy.sh.

Currently, the configuration used is:

remote_user="rld"
remote_system="chromatofore.local"



### Update for WiFi SSID Changes

The SSID for your Wi-Fi network, along with its password, 
is typically stored in a file named octopi-wpa-supplicant.txt 
on the SD card used for OctoPi, the Raspberry Pi distribution 
for controlling 3D printers. This file is where you set up your 
Wi-Fi network details to enable your Raspberry Pi to connect 
to your network.  

### Manual Raspberry PI steps

For issues related to I2C communication on a Raspberry Pi, 
especially when working with OctoPrint or similar applications, 
there are a few key settings and configurations that you would 
typically need to adjust manually. These settings are usually 
not stored on the SD card but rather configured directly on the 
Raspberry Pi's operating system. Here are the steps you might 
need to take:

#### Enable I2C Interface:

You need to enable the I2C interface on the Raspberry Pi. This is 
usually done through the raspi-config tool.

Access this tool via the command line (sudo raspi-config), 
navigate to the interfacing options, and enable I2C.

#### Adjust I2C Bus Speed:

Modifying the I2C bus speed is done by editing the /boot/config.txt file.
You can do this by running sudo nano /boot/config.txt and adding a 
line like dtparam=i2c_arm_baudrate=50000 (replace 50000 with the desired speed in Hz).

#### Change Permissions:

You might have modified permissions to allow certain users 
or groups to access the I2C devices without needing root privileges.
This can involve adding your user (typically pi) to the i2c 
group with sudo usermod -a -G i2c pi.
You might also need to modify udev rules for I2C device access. 
This involves creating or editing a file in /etc/udev/rules.d/ 
to set the appropriate permissions for the I2C devices.


#### Install I2C Tools:

If you haven’t already, you might need to install I2C tools 
on your Raspberry Pi with sudo apt-get install i2c-tools.

#### Check for Conflicts:

Ensure that no other services or configurations are conflicting 
with the I2C settings. This might involve checking other scripts 
or programs that start on boot.

#### Reboot the Raspberry Pi:

After making these changes, reboot your Raspberry Pi to ensure 
all settings are applied correctly.

#### Verify I2C Functionality:

You can verify if the I2C devices are being detected correctly 
by using the command 

i2cdetect -y 1.

Remember, these changes are made to the Raspberry Pi's system 
configuration and are not part of the OctoPrint settings 
stored on the SD card. If you migrate to a new Raspberry Pi, 
you'll need to replicate these configurations manually.

## Development and Deployment Process

### Development in Visual Studio Code

1. Make changes in the source code within Visual Studio Code.
2. Save all changes.
3. Run the deployment script from a terminal window in Visual Studio Code
4. Exercise the application in the browser.  

### Deployment Script (`deploy.sh`) Functionality

The `deploy.sh` script automates the deployment of the ChromatoFore Octoprint 
plugin to a develoment Raspberry Pi and shows the latest version in a browser.

With cach deployment the minor version is incremented.  Also, it pulls any
changes that have been made by the GitHub repositories CI/CD system.

To run the deployment script:

```bash
cd ~/code/chromatofore-octoprint-plugin
./scripts/deploy.sh

```

### Developer Tools (DevTools) Guide

DevTools offer tools to debug, profile, and inspect web pages. Here's 
how to navigate its primary functionalities:

#### **Accessing the Console**

The console allows you to log information for JavaScript development and 
interact with a page using JavaScript expressions.

- **Shortcut**: 
  - Linux: `Ctrl` + `Shift` + `J`
  
- **Manual Access**:
  - Right-click on a page element.
  - Select `Inspect`.
  - Navigate to the `Console` tab.

#### **Viewing Network Traffic**

The Network panel records details about network operations, including timing 
data, HTTP headers, cookies, WebSocket data, and more.

- **Shortcut**:
  - Linux: `Ctrl` + `Shift` + `E`


## Versioning Strategy

The ChromatoFore Octoprint plugin is currently in pre-release, advancing 
towards an MVP. The version number is in `version.txt`. We aren't using Git 
releases currently.

Our version numbers adhere to [PEP440](https://www.python.org/dev/peps/pep-0440/),
with a MAJOR.MINOR.PATCH format, consistent with semantic versioning principles.

- **PATCH**: Incremented automatically with each deployment to the development 
  Raspberry PI, managed by the bash script in `scripts/deploy.sh`.

- **MINOR**: Increments when most development milestone objectives are achieved. 
  Don't hold back incrementing because some low priority objectives have
  been deferred, but you are mostly working on the next milestone.  
  Features for 0.x will generally be under 0.x-1.nnn. Bugfixes could be in 
  version 0.x.nnn, or any later version.  Note that the minor number might 
  exceed 9, leading to versions like 0.12.123. We expect the minor version 
  to increase every sprint or so.

- **MAJOR**: Remains at 0 until the entire system reaches MVP. If the limiting 
  factor for MVP is in the 3D parts, electronics, or documentation, the plugin 
  will maintain major version 0. Only when the system is ready for public use 
  will we move to version 1, which is a beta release. Version 1.1 will be 
  released if there's significant end-user engagement and early adopters 
  have set up the system.
