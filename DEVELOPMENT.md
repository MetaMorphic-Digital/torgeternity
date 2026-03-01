# **Torg Eternity System** for Foundry VTT.

## using the system for development

### Prerequisite

1. download the system git
1. download and install node https://nodejs.org/en/download

### Build the system

1. run `npm ci` in the terminal/command Line of the project
1. run `npm run build` in the terminal/command Line of the project (make packs from yml)

#### Optionally set up Intellisense for VSCode

This requires you to have `Developer Mode` enabled in Windows 11 (in Settings -> System -> Advanced) to run the createSymlinks script.

1. copy `example-foundry-config.yaml` to `foundry-config.yaml`
2. change the path inside the file to where your Foundry server is installed on your local machine.
3. run `npm run createSymlinks` in ther terminal/command Line of the project

### commit data

1. run `npm run extract` in the terminal/command Line of the project (make yml from packs)
1. commit the yml files as usual

it is also possible to directly edit the yml files in src/packs

## Releasing
### Performing the release 
#### on github:

1. Make sure Changelog is up to date.
1. Merge all commits for the release to master
1. Check if foundry loads with a checked out master
1. Go to github, click on "Releases"
   - "Draft new release" Button
   - Choose a tag exactly like the version number, example: "3.7.0"
   - select the master branch as release branch
   - Add a description (copy & paste the Changelog snippet for that version)
  
#### on Foundry:
- use [this link](https://foundryvtt.com/packages/torgeternity/edit)
  - Version Number: natural
  - Package Manifest URL: release-URL with system.json, for example: https://github.com/MetaMorphic-Digital/torgeternity/releases/download/3.6.2/system.json
  - Release Notes: From 3.7.0 it's always https://github.com/MetaMorphic-Digital/torgeternity/blob/master/Changelog.md
  - Foundry-Versions like in system.json
