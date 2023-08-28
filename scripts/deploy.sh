
# Read current version from version.txt
current_version=$(cat "../version.txt")

# Increment the patch version number
IFS='.' read -ra version_parts <<< "$current_version"
major=${version_parts[0]}
minor=${version_parts[1]}
patch=${version_parts[2]}
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

# Update version.txt with new version
echo "$new_version" > "../version.txt"

rsync -avz ~/code/chromatofore-octoprint-plugin/ rld@chromatofore.local:~/chromatofore-octoprint-plugin/
ssh rld@chromatofore.local "~/oprint/bin/pip install ~/chromatofore-octoprint-plugin"
ssh rld@chromatofore.local "sudo service octoprint restart"