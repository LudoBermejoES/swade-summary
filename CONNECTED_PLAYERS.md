# Connected Players API - Foundry VTT

## Overview

This document describes how to access connected players and their assigned characters in Foundry VTT, specifically for the SWADE Summary module.

## Core API

### Getting All Users

```javascript
game.users                  // Collection of all User documents in the world
game.users.players          // Array of all player users (excludes GMs)
game.user                   // The current user (yourself)
```

### User Properties

| Property | Type | Description |
|----------|------|-------------|
| `user.id` | String | Unique user ID |
| `user.name` | String | Display name |
| `user.active` | Boolean | Whether user is currently connected |
| `user.character` | Actor | The user's assigned character (or null) |
| `user.role` | Number | Permission level (see CONST.USER_ROLES) |
| `user.isGM` | Boolean | Has GAMEMASTER or ASSISTANT role |
| `user.isActiveGM` | Boolean | Is the active GM |
| `user.isSelf` | Boolean | Is this the current client's user |

### User Roles (CONST.USER_ROLES)

```javascript
CONST.USER_ROLES = {
    NONE: 0,
    PLAYER: 1,
    TRUSTED: 2,
    ASSISTANT: 3,
    GAMEMASTER: 4
}
```

## Common Patterns

### Get All Connected Players

```javascript
// All connected users (including GMs)
const connectedUsers = game.users.filter(u => u.active);

// Only connected players (excludes GMs)
const connectedPlayers = game.users.filter(u => u.active && !u.isGM);

// Alternative using .players property
const connectedPlayers = game.users.players.filter(u => u.active);
```

### Get Connected Players with Assigned Characters

```javascript
// Get all connected players who have a character assigned
const playersWithCharacters = game.users.filter(u => u.active && !u.isGM && u.character);

// Get just the character actors
const playerCharacters = game.users
    .filter(u => u.active && !u.isGM && u.character)
    .map(u => u.character);
```

### Get Character Tokens on Current Scene

```javascript
// Get tokens for all connected player characters
const characterTokens = game.users.players.reduce((tokens, u) => {
    let token = u.character ? u.character.getActiveTokens()[0] : null;
    if (token) {
        tokens.push(token);
    }
    return tokens;
}, []);
```

### Check if Actor is a Player Character

```javascript
// Check if an actor is assigned to any player
function isPlayerCharacter(actor) {
    return game.users.some(u => u.character?.id === actor.id);
}

// Get the player who owns a specific character
function getPlayerForCharacter(actor) {
    return game.users.find(u => u.character?.id === actor.id);
}
```

## Implementation in SWADE Summary

### Current Behavior (Before Update)

The module reads character names/IDs from a settings string and displays only those characters.

```javascript
static getSelectedCharacters() {
    const selectedString = game.settings.get('swade-summary', 'selected-characters');
    // ... parse and return matching actors
}
```

### New Behavior (After Update)

The module now:
1. **Always** shows characters assigned to connected players (automatic)
2. **Additionally** shows any characters specified in settings (forced/extra)

```javascript
static getSelectedCharacters() {
    const characters = [];
    const addedIds = new Set();

    // 1. First, add all characters from connected players
    const connectedPlayerCharacters = game.users
        .filter(u => u.active && !u.isGM && u.character)
        .map(u => u.character)
        .filter(actor => actor.type === 'character');

    for (const actor of connectedPlayerCharacters) {
        if (!addedIds.has(actor.id)) {
            characters.push(actor);
            addedIds.add(actor.id);
        }
    }

    // 2. Then, add any additional "forced" characters from settings
    const selectedString = game.settings.get('swade-summary', 'selected-characters');
    if (selectedString.trim()) {
        const identifiers = selectedString.split(',').map(s => s.trim()).filter(s => s);

        for (const identifier of identifiers) {
            let actor = game.actors.get(identifier);
            if (!actor) {
                actor = game.actors.find(a =>
                    a.name.toLowerCase() === identifier.toLowerCase() &&
                    a.type === 'character'
                );
            }

            if (actor && actor.type === 'character' && !addedIds.has(actor.id)) {
                characters.push(actor);
                addedIds.add(actor.id);
            }
        }
    }

    return characters;
}
```

### Benefits of New Approach

1. **Automatic Updates**: When players connect/disconnect, the summary automatically reflects current players
2. **No Manual Configuration Required**: Works out of the box without setting up character names
3. **Flexible Override**: GM can still add extra characters (NPCs, absent players) via settings
4. **No Duplicates**: Uses a Set to prevent the same character appearing twice

## API Reference Links

- [User Class - Foundry VTT API v13](https://foundryvtt.com/api/classes/foundry.documents.User.html)
- [Game Class - Foundry VTT API v13](https://foundryvtt.com/api/classes/foundry.Game.html)
- [Actor Class - Foundry VTT API v13](https://foundryvtt.com/api/classes/foundry.documents.Actor.html)
- [Foundry VTT Community Wiki - API](https://foundryvtt.wiki/en/development/api)
- [Learning the Foundry API](https://github.com/foundry-vtt-community/wiki/blob/main/API-Learning-API.md)

## Version Compatibility

This API is consistent across Foundry VTT v10, v11, v12, and v13. The `user.character` property and `user.active` flag have been stable since early versions.
