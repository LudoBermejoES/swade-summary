# SWADE Summary

A Foundry VTT module for the SWADE (Savage Worlds Adventure Edition) system that provides a floating button to display summaries of selected characters' edges and hindrances.

## Features

- Floating button on screen for easy access
- Configurable button position (top-left, top-right, bottom-left, bottom-right)
- Character selection via names or IDs in module settings
- Shows selected characters' names, edges, and hindrances in a grid layout
- Clean, easy-to-read card-based interface

## Installation

1. Download the module files
2. Place them in your Foundry VTT modules directory
3. Enable the module in your game world
4. A floating button will appear on your screen

## Configuration

1. Go to **Game Settings** > **Configure Settings** > **Module Settings**
2. Find **SWADE Summary** settings
3. In **Selected Characters**, enter a comma-separated list of character names or IDs
   - Example: `"John Doe, Jane Smith, abc123def456"`
   - You can mix names and IDs
   - Character names are case-insensitive
4. Choose your preferred **Button Position** on screen
5. Select your preferred **UI Style** (Default or Supers)
6. Toggle **Enable Summaries** to show/hide the floating button

## Usage

1. Configure the characters you want to track in the module settings
2. Click the floating button (users icon) to open the summary dialog
3. View all selected characters' edges and hindrances in an organized grid layout

## Character Selection

The module supports two ways to identify characters:
- **By Name**: Use the exact character name (case-insensitive)
- **By ID**: Use the Foundry actor ID (found in the actor's data)

Example configuration: `Paladin Bob, Wizard Alice, 8x7y9z1a2b3c4d5e`

## UI Styles

The module includes two visual themes:

- **Default**: Clean, standard SWADE styling with neutral colors
- **Supers**: Comic book-inspired theme with vibrant colors, perfect for superhero campaigns using the SWADE Supers Companion

Choose your preferred style in the module settings to match your campaign's theme.

## Author

Created by Ludo Bermejo (ludobermejo@gmail.com)

## System Requirements

- Foundry VTT v12 or higher
- SWADE system

## License

This module is created for use with the SWADE system in Foundry VTT.