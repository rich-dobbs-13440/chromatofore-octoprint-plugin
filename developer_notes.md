

# Developer Notes

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
