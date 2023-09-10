#!/bin/bash

# Script deploy.sh is used to transfer the current code from the development PC over to
# the Raspberry PI, install the plugin, and then restart the octoprint service, 
# so that the new code for the plugin is used.

set -e  # Stop script on error
set -x  # Echo commands

echo "Start"
date

# Configuration Variables
remote_user="rld"
remote_system="chromatofore.local"
ssh_user=$remote_user@$remote_system 
remote_dir="~/chromatofore-octoprint-plugin"
delete_on_failure=true

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
rsync --exclude '.git/' --exclude '.github/' --exclude 'venv/' --exclude 'scripts/' -avz $base_dir/ $ssh_user:$remote_dir/


# Signal the plugin to shut down and capture the response
response=$(ssh $ssh_user \
    "curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H 'X-Api-Key: $OCTOPRINT_API_KEY' \
    -d '{\"command\":\"shutdown_chromatofore_plugin\"}' \
    http://localhost:5000/api/plugin/chromatofore")


# Check if the response contains the error
if [[ $response == *"The browser (or proxy) sent a request that this server could not understand."* ]]; then
    shutdown_success=false
    echo "Shutdown failed with error message."
else
    shutdown_success=true
fi

# If DELETE_ON_FAILURE is set to true, delete even if shutdown fails. Else, only delete if shutdown succeeds.
if [ "$delete_on_failure" = true ] || [ "$shutdown_success" = true ]; then
    # Delete the octoprint.log file on the OctoPi system
    ssh $ssh_user "rm ~/.octoprint/logs/octoprint.log"
fi


# Install the updated plugin
ssh $ssh_user "~/oprint/bin/pip install $remote_dir"



# Restart the OctoPrint service
ssh $ssh_user "sudo service octoprint restart"


# Pause for a few seconds to let the plugin handle shutdown.
sleep 12s

git pull

# View Octoprint without waint to allow testing and debugging.
brave-browser --new-window http://$remote_system &

sleep 2s

# Let the user know when this happened.
echo "Finish"
date
