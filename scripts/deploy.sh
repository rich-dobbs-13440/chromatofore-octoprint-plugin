#!/bin/bash

# Script deploy.sh is used to transfer the current code from the development PC over to
# the Raspberry PI, install the plugin, and then restart the octoprint service, 
# so that the new code for the plugin is used.

set -e  # Stop script on error
set -x  # Echo commands

echo "Start"
date

# Configuration Variables
ssh_user="rld"
remote_system="chromatofore.local"
remote_dir="~/chromatofore-octoprint-plugin"

# Get the directory where the script is located
script_dir=$(dirname "$0")
# Get the base directory, which is one directory up from the script directory
base_dir=$(dirname "$script_dir")
version_file="$base_dir/version.txt"

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

cp "$base_dir/README.md" "$base_dir/octoprint_chromatofore/data/README.md"
cp "$base_dir/version.txt" "$base_dir/octoprint_chromatofore/data/version.txt"

# Sync the plugin files to the remote Raspberry Pi
rsync --exclude '.git/' --exclude '.github/' --exclude 'venv/' --exclude 'scripts/' -avz $base_dir/ $ssh_user@$remote_system:$remote_dir/

# Install the updated plugin
ssh $ssh_user@$remote_system "~/oprint/bin/pip install $remote_dir"

# Signal the plugin to shut down
ssh $ssh_user@$remote_system "curl -s -X POST -H 'Content-Type: application/json' -H 'X-Api-Key: $OCTOPRINT_API_KEY' -d '{\"command\":\"shutdown_chromatofore_plugin\"}' http://localhost:5000/api/plugin/chromatofore"

# Restart the OctoPrint service
ssh $ssh_user@$remote_system "sudo service octoprint restart"

# Pause for a few seconds to let the plugin handle shutdown
sleep 12s

# View Octoprint to allow testing and debugging.  
brave-browser --new-window http://$remote_system &

sleep 2s

# Let the user know when this happened.
echo "Finish"
date
