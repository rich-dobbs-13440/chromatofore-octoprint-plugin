#!/bin/bash

# Script  deploy.sh is used to transfer the current code from the development PC over to
# the Raspberry PI, install the plugin, and then restart the octoprint service, 
# so that the new code for the plug in is used.


set -e  # Stop script on error
set -x  # Echo commands

# Get the directory where the script is located
script_dir=$(dirname "$0")
version_file="$script_dir/../version.txt"

# Read current version from version.txt
current_version=$(cat $version_file)
echo "Current Version:" $current_version

# Increment the patch version number
IFS='.' read -ra version_parts <<< "$current_version"
major=${version_parts[0]}
minor=${version_parts[1]}
patch=${version_parts[2]}
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

# Update version.txt with new version
echo "$new_version" > $version_file

# Sync the plugin files to the remote Raspberry Pi
rsync -avz ~/code/chromatofore-octoprint-plugin/ rld@chromatofore.local:~/chromatofore-octoprint-plugin/

# Install the updated plugin
ssh rld@chromatofore.local "~/oprint/bin/pip install ~/chromatofore-octoprint-plugin"

# Signal the plugin to shut down
ssh rld@chromatofore.local "curl -s -X POST -H 'Content-Type: application/json' -H 'X-Api-Key: $OCTOPRINT_API_KEY' -d '{\"command\":\"shutdown_chromatofore_plugin\"}' http://localhost:5000/api/plugin/chromatofore"

# Pause for a few seconds to let the plugin handle shutdown
sleep 5

# Restart the OctoPrint service
ssh rld@chromatofore.local "sudo service octoprint restart"