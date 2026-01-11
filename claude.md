# SWADE Summary Module

## Overview

SWADE Summary is a Foundry VTT module for the Savage Worlds Adventure Edition (SWADE) system. It provides Game Masters with a floating button that opens a dialog displaying character summaries (edges and hindrances) in a configurable grid layout.

## Tech Stack

- **Platform**: Foundry VTT v12+ (verified on v13)
- **System Dependency**: SWADE (`game.system.id === 'swade'`)
- **Language**: Vanilla JavaScript (ES Modules)
- **Templating**: Handlebars (.hbs)
- **Styling**: CSS (two theme files)
- **Localization**: JSON (i18n)

## File Structure

```
swade-summary/
├── module.json                    # Foundry module manifest
├── swade-summary.js               # Main module code (651 lines)
├── README.md                      # User documentation
├── lang/
│   └── en.json                    # English localization strings
├── styles/
│   ├── swade-summary-default.css  # Default neutral theme
│   └── swade-summary-supers.css   # Comic book theme (Orbitron font, gradients)
└── templates/
    └── character-summary.hbs      # Dialog template for character cards
```

## Key Files

### module.json
Foundry manifest defining:
- Module ID: `swade-summary`
- Version: `1.0.0`
- Entry point: `swade-summary.js` (ES module)
- Styles: Both CSS files loaded
- Localization: `lang/en.json`
- Compatibility: Foundry v12+, requires SWADE system

### swade-summary.js
Main application with `SWADESummary` static class:

**Hooks:**
- `Hooks.once('init')` - Registers all game settings
- `Hooks.once('ready')` - Creates floating button (GM only, SWADE only)
- `Hooks.on('updateSetting')` - Live updates button position on setting change

**Key Methods:**
- `createFloatingButton()` - Creates/positions the floating button with drag support
- `showCharacterSummary()` - Opens dialog with character cards
- `getCharacterData(identifier)` - Fetches actor by name or ID
- `cleanDescription(html)` - Strips HTML/UUID/Compendium links from text
- `showItemDescription(itemName, description)` - Shows item detail modal

**Exports:**
- `window.SWADESummary` - Global access to the class

### templates/character-summary.hbs
Handlebars template with:
- Grid container with dynamic column classes
- Character cards showing name, edges list, hindrances list
- Clickable items with `data-item-name` and `data-description` attributes
- Hindrance severity display (Major/Minor)
- Localized labels via `{{localize "SWADE-SUMMARY.key"}}`

### styles/
- **swade-summary-default.css**: Neutral gray theme matching Foundry defaults
- **swade-summary-supers.css**: Comic book aesthetic with gold/purple gradients, Orbitron font, glow effects

## Module Settings

| Key | Type | Default | Scope | Description |
|-----|------|---------|-------|-------------|
| `enable-summaries` | Boolean | `true` | world | Enable/disable module |
| `selected-characters` | String | `""` | world | Comma-separated character names or actor IDs |
| `button-position` | String | `"top-left"` | client | Position preset or "fixed" for draggable |
| `button-position-x` | Number | `20` | client | X coordinate when position is "fixed" |
| `button-position-y` | Number | `100` | client | Y coordinate when position is "fixed" |
| `characters-per-row` | Number | `2` | world | Grid columns (1-3) |
| `ui-style` | String | `"default"` | world | Theme: "default" or "supers" |

**Access settings:**
```javascript
game.settings.get('swade-summary', 'setting-key')
game.settings.set('swade-summary', 'setting-key', value)
```

## Connected Players & Characters

### User Collection
```javascript
game.users                  // All users in the world
game.users.players          // All player users (excludes GMs)
game.user                   // Current user
```

### Key User Properties
| Property | Type | Description |
|----------|------|-------------|
| `user.active` | Boolean | Whether user is currently connected |
| `user.character` | Actor | User's assigned character (or null) |
| `user.isGM` | Boolean | Has GAMEMASTER or ASSISTANT role |
| `user.name` | String | Display name |

### Common Patterns
```javascript
// Get all connected players with assigned characters
const playersWithCharacters = game.users.filter(u => u.active && !u.isGM && u.character);

// Get just the character actors from connected players
const playerCharacters = game.users
    .filter(u => u.active && !u.isGM && u.character)
    .map(u => u.character);

// Check if actor is assigned to any player
const isPlayerCharacter = game.users.some(u => u.character?.id === actor.id);

// Get player who owns a character
const owner = game.users.find(u => u.character?.id === actor.id);
```

### Character Selection Logic
The module combines two sources for displayed characters:
1. **Automatic**: Characters assigned to connected players (always shown)
2. **Manual**: Additional characters from settings (optional, for NPCs or absent players)

## SWADE Data Structures

### Actor Data
```javascript
const actor = game.actors.get(actorId);
// or
const actor = game.actors.find(a => a.name.toLowerCase() === name.toLowerCase());

actor.type === 'character'  // Filter for characters only
actor.items                 // Collection of items (edges, hindrances, etc.)
```

### Item Types
- `edge` - Character advantages
- `hindrance` - Character disadvantages with severity

### Hindrance Severity (multiple formats supported)
```javascript
// Boolean format
item.system.major === true   // Major hindrance
item.system.major === false  // Minor hindrance

// String format
item.system.severity         // "major" or "minor"

// Fallback
item.system.level
```

### Item Description Locations
```javascript
item.system.description      // Primary location
item.data.data.description   // Legacy format
item.description             // Fallback
```

## Architecture Patterns

### Singleton Pattern
`SWADESummary` is a static class - all methods are static, no instantiation needed.

### Drag & Drop Implementation
```javascript
// Key flags
let isDragging = false;
let dragStartX, dragStartY, initialX, initialY;

// Events handled: mousedown, mousemove, mouseup, touchstart, touchmove, touchend
// Click vs drag detection: only fires click if !isDragging
// Viewport constraints: keeps button within window bounds
// Auto-save: updates settings on drag end
```

### Description Cleaning
The `cleanDescription()` method removes:
- HTML tags
- `@UUID[...]` references
- `@Compendium[...]` links
- `@Actor[...]`, `@Item[...]`, `@JournalEntry[...]` links
- Extra whitespace (preserves single newlines)

### Dialog Sizing
Dynamic sizing based on layout:
- 1 column: 450px width, 400px card width
- 2 columns: 750px width, 320px card width
- 3 columns: 1050px width, 280px card width
- Height: 200px + (characters * 150px), max 800px

## Foundry API Usage

### Settings Registration
```javascript
game.settings.register('swade-summary', 'key', {
    name: 'SWADE-SUMMARY.settings.name',
    hint: 'SWADE-SUMMARY.settings.hint',
    scope: 'world',  // or 'client'
    config: true,
    type: String,    // Boolean, Number, String
    default: 'value',
    choices: { key: 'Label' }  // For select dropdowns
});
```

### Localization
```javascript
game.i18n.localize('SWADE-SUMMARY.key')
```

### Dialog Creation
```javascript
new Dialog({
    title: 'Title',
    content: htmlContent,
    buttons: { close: { label: 'Close' } },
    render: (html) => { /* Add event listeners */ }
}, {
    width: 750,
    height: 600,
    resizable: true,
    classes: ['swade-summary-dialog', 'theme-class']
}).render(true);
```

### Template Rendering
```javascript
const content = await renderTemplate(
    'modules/swade-summary/templates/character-summary.hbs',
    { characters, columnsClass: 'two-columns' }
);
```

## Common Tasks

### Adding a New Setting
1. Register in `Hooks.once('init')` block
2. Add localization keys to `lang/en.json`
3. Use setting value where needed

### Adding a New Theme
1. Create new CSS file in `styles/`
2. Add to `module.json` styles array
3. Add choice to `ui-style` setting registration
4. Add theme class logic in `showCharacterSummary()`

### Modifying Character Card Display
1. Edit `templates/character-summary.hbs` for structure
2. Edit active CSS file for styling
3. Modify `showCharacterSummary()` for data preparation

### Adding New Character Data
1. Extract data in `getCharacterData()` method
2. Add to returned object
3. Display in template

## Testing

No automated tests. Manual testing:
1. Enable module in Foundry
2. Verify button appears (GM only)
3. Configure characters in settings
4. Click button to open dialog
5. Test drag functionality
6. Test item click for descriptions
7. Switch themes and verify styling

## Localization Keys Structure

```json
{
  "SWADE-SUMMARY": {
    "button": { "label": "..." },
    "dialog": { "title": "...", "edges": "...", "hindrances": "..." },
    "settings": {
      "settingName": { "name": "...", "hint": "..." }
    },
    "severity": { "major": "...", "minor": "..." }
  }
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Touch events for mobile/tablet
- CSS Grid and Flexbox for layout

## Known Considerations

- Button only visible to GM (`game.user.isGM`)
- Module silently skips initialization if SWADE system not active
- Character lookup is case-insensitive for names
- Supports both actor IDs and names for character selection
- Drag position persists per-client (not per-world)
