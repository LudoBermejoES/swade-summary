/**
 * SWADE Summary Module - Test Suite
 */

// We'll test the core logic by recreating the testable methods
// Since the module uses global Foundry objects, we test the logic in isolation

describe('SWADESummary', () => {
  // Helper to create mock actors
  const createMockActor = (id, name, type = 'character', items = []) => ({
    id,
    name,
    type,
    items: {
      filter: (fn) => items.filter(fn)
    }
  });

  // Helper to create mock users
  const createMockUser = (id, name, active, isGM, character = null) => ({
    id,
    name,
    active,
    isGM,
    character
  });

  // Helper to create mock items
  const createMockItem = (id, name, type, system = {}) => ({
    id,
    name,
    type,
    system
  });

  describe('getSelectedCharacters', () => {
    // Recreate the getSelectedCharacters logic for testing
    const getSelectedCharacters = (users, actors, selectedString) => {
      const characters = [];
      const addedIds = new Set();

      // 1. First, add all characters from connected players (automatic)
      const connectedPlayerCharacters = users
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
      if (selectedString.trim()) {
        const identifiers = selectedString.split(',').map(s => s.trim()).filter(s => s);

        for (const identifier of identifiers) {
          // Try to find by ID first
          let actor = actors.find(a => a.id === identifier);

          // If not found by ID, try by name
          if (!actor) {
            actor = actors.find(a =>
              a.name.toLowerCase() === identifier.toLowerCase() &&
              a.type === 'character'
            );
          }

          // Add if valid and not already added
          if (actor && actor.type === 'character' && !addedIds.has(actor.id)) {
            characters.push(actor);
            addedIds.add(actor.id);
          }
        }
      }

      return characters;
    };

    test('returns empty array when no connected players and no settings', () => {
      const users = [];
      const actors = [];
      const result = getSelectedCharacters(users, actors, '');
      expect(result).toEqual([]);
    });

    test('returns characters from connected players', () => {
      const actor1 = createMockActor('actor1', 'Hero One');
      const actor2 = createMockActor('actor2', 'Hero Two');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1),
        createMockUser('user2', 'Player 2', true, false, actor2),
        createMockUser('gm', 'Game Master', true, true, null)
      ];

      const actors = [actor1, actor2];
      const result = getSelectedCharacters(users, actors, '');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Hero One');
      expect(result[1].name).toBe('Hero Two');
    });

    test('excludes disconnected players', () => {
      const actor1 = createMockActor('actor1', 'Hero One');
      const actor2 = createMockActor('actor2', 'Hero Two');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1),
        createMockUser('user2', 'Player 2', false, false, actor2) // disconnected
      ];

      const actors = [actor1, actor2];
      const result = getSelectedCharacters(users, actors, '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('excludes GM characters', () => {
      const actor1 = createMockActor('actor1', 'Hero One');
      const gmActor = createMockActor('gmActor', 'GM Character');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1),
        createMockUser('gm', 'Game Master', true, true, gmActor)
      ];

      const actors = [actor1, gmActor];
      const result = getSelectedCharacters(users, actors, '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('adds additional characters from settings by name', () => {
      const actor1 = createMockActor('actor1', 'Hero One');
      const npcActor = createMockActor('npc1', 'Important NPC');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1)
      ];

      const actors = [actor1, npcActor];
      const result = getSelectedCharacters(users, actors, 'Important NPC');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Hero One');
      expect(result[1].name).toBe('Important NPC');
    });

    test('adds additional characters from settings by ID', () => {
      const actor1 = createMockActor('actor1', 'Hero One');
      const npcActor = createMockActor('npc1', 'Important NPC');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1)
      ];

      const actors = [actor1, npcActor];
      const result = getSelectedCharacters(users, actors, 'npc1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Hero One');
      expect(result[1].name).toBe('Important NPC');
    });

    test('handles multiple additional characters comma-separated', () => {
      const npc1 = createMockActor('npc1', 'NPC One');
      const npc2 = createMockActor('npc2', 'NPC Two');
      const npc3 = createMockActor('npc3', 'NPC Three');

      const users = [];
      const actors = [npc1, npc2, npc3];
      const result = getSelectedCharacters(users, actors, 'NPC One, NPC Two, npc3');

      expect(result).toHaveLength(3);
      expect(result.map(a => a.name)).toEqual(['NPC One', 'NPC Two', 'NPC Three']);
    });

    test('prevents duplicate characters', () => {
      const actor1 = createMockActor('actor1', 'Hero One');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1)
      ];

      const actors = [actor1];
      // Try to add the same character via settings
      const result = getSelectedCharacters(users, actors, 'Hero One, actor1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('case-insensitive name matching', () => {
      const actor1 = createMockActor('actor1', 'Hero One');

      const users = [];
      const actors = [actor1];
      const result = getSelectedCharacters(users, actors, 'HERO ONE');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('excludes non-character actors', () => {
      const vehicle = createMockActor('v1', 'Party Wagon', 'vehicle');
      const npc = createMockActor('npc1', 'Friendly NPC', 'npc');

      const users = [];
      const actors = [vehicle, npc];
      const result = getSelectedCharacters(users, actors, 'Party Wagon, Friendly NPC');

      expect(result).toHaveLength(0);
    });

    test('handles players without assigned characters', () => {
      const actor1 = createMockActor('actor1', 'Hero One');

      const users = [
        createMockUser('user1', 'Player 1', true, false, actor1),
        createMockUser('user2', 'Player 2', true, false, null) // no character
      ];

      const actors = [actor1];
      const result = getSelectedCharacters(users, actors, '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('handles whitespace in settings string', () => {
      const actor1 = createMockActor('actor1', 'Hero One');

      const users = [];
      const actors = [actor1];
      const result = getSelectedCharacters(users, actors, '  Hero One  ,  ');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hero One');
    });

    test('handles empty identifiers gracefully', () => {
      const actor1 = createMockActor('actor1', 'Hero One');

      const users = [];
      const actors = [actor1];
      const result = getSelectedCharacters(users, actors, ',,,Hero One,,,');

      expect(result).toHaveLength(1);
    });
  });

  describe('cleanDescription', () => {
    // Recreate the cleanDescription logic for testing
    const cleanDescription = (description) => {
      if (!description) return 'No description available';

      let cleaned = description;

      // Remove HTML tags first if any
      cleaned = cleaned.replace(/<[^>]*>/g, '');

      // Remove @UUID[...]{text} patterns, keeping only the display text
      cleaned = cleaned.replace(/@UUID\[([^\]]+)\]\{([^}]+)\}/g, '$2');

      // Remove @Compendium[...]{text} patterns, keeping only the display text
      cleaned = cleaned.replace(/@Compendium\[([^\]]+)\]\{([^}]+)\}/g, '$2');

      // Remove other Foundry VTT text editor patterns like @ActorLink, @JournalEntry, etc.
      cleaned = cleaned.replace(/@[A-Za-z]+\[([^\]]+)\]\{([^}]+)\}/g, '$2');

      // Remove any remaining @ patterns without curly braces
      cleaned = cleaned.replace(/@[A-Za-z]+\[([^\]]+)\]/g, '');

      // Clean up any remaining brackets
      cleaned = cleaned.replace(/\[([^\]]+)\]/g, '$1');

      // Clean up multiple spaces, line breaks, and normalize whitespace
      cleaned = cleaned.replace(/\s+/g, ' ');
      cleaned = cleaned.replace(/\n\s*\n/g, '\n');
      cleaned = cleaned.trim();

      // If we ended up with empty text, provide fallback
      if (!cleaned || cleaned.length === 0) {
        return 'No description available';
      }

      return cleaned;
    };

    test('returns fallback for null description', () => {
      expect(cleanDescription(null)).toBe('No description available');
    });

    test('returns fallback for undefined description', () => {
      expect(cleanDescription(undefined)).toBe('No description available');
    });

    test('returns fallback for empty string', () => {
      expect(cleanDescription('')).toBe('No description available');
    });

    test('strips HTML tags', () => {
      const input = '<p>This is <strong>bold</strong> text</p>';
      expect(cleanDescription(input)).toBe('This is bold text');
    });

    test('preserves plain text', () => {
      const input = 'Simple plain text description';
      expect(cleanDescription(input)).toBe('Simple plain text description');
    });

    test('removes @UUID patterns keeping display text', () => {
      const input = 'See @UUID[Actor.abc123]{John Smith} for details';
      expect(cleanDescription(input)).toBe('See John Smith for details');
    });

    test('removes @Compendium patterns keeping display text', () => {
      const input = 'Refer to @Compendium[swade.edges]{Quick} edge';
      expect(cleanDescription(input)).toBe('Refer to Quick edge');
    });

    test('removes @ActorLink patterns keeping display text', () => {
      const input = 'Talk to @ActorLink[id123]{Bob the Merchant}';
      expect(cleanDescription(input)).toBe('Talk to Bob the Merchant');
    });

    test('removes @JournalEntry patterns keeping display text', () => {
      const input = 'See @JournalEntry[journal1]{World Lore} for background';
      expect(cleanDescription(input)).toBe('See World Lore for background');
    });

    test('removes @ patterns without display text', () => {
      const input = 'Reference @UUID[something.here] in the text';
      expect(cleanDescription(input)).toBe('Reference in the text');
    });

    test('handles multiple @ patterns', () => {
      const input = '@UUID[a]{First} and @Compendium[b]{Second} and @Item[c]{Third}';
      expect(cleanDescription(input)).toBe('First and Second and Third');
    });

    test('normalizes whitespace', () => {
      const input = 'Too    many     spaces';
      expect(cleanDescription(input)).toBe('Too many spaces');
    });

    test('handles complex HTML with @ patterns', () => {
      const input = '<p>The <strong>@UUID[Actor.x]{Hero}</strong> must defeat the enemy.</p>';
      expect(cleanDescription(input)).toBe('The Hero must defeat the enemy.');
    });

    test('removes standalone brackets', () => {
      const input = 'Item [Rare] is valuable';
      expect(cleanDescription(input)).toBe('Item Rare is valuable');
    });

    test('returns fallback when only whitespace remains', () => {
      const input = '<p>   </p>';
      expect(cleanDescription(input)).toBe('No description available');
    });
  });

  describe('prepareTemplateData', () => {
    // Recreate the prepareTemplateData logic for testing
    const prepareTemplateData = (selectedCharacters, charactersPerRow) => {
      const characters = selectedCharacters.map(actor => {
        const edges = actor.items.filter(i => i.type === 'edge').map(edge => ({
          name: edge.name,
          id: edge.id
        }));

        const hindrances = actor.items.filter(i => i.type === 'hindrance').map(hindrance => {
          // Try to get severity - check common SWADE properties
          let severity = '';
          if (hindrance.system?.major === true) {
            severity = ' (Major)';
          } else if (hindrance.system?.major === false) {
            severity = ' (Minor)';
          } else if (hindrance.system?.severity) {
            severity = ` (${hindrance.system.severity})`;
          } else if (hindrance.system?.level) {
            severity = ` (${hindrance.system.level})`;
          }

          return {
            name: hindrance.name + severity,
            id: hindrance.id
          };
        });

        return {
          name: actor.name,
          id: actor.id,
          edges: edges.length > 0 ? edges : null,
          hindrances: hindrances.length > 0 ? hindrances : null
        };
      });

      return {
        characters: characters,
        columnsClass: `cols-${charactersPerRow}`
      };
    };

    test('returns empty characters array for no actors', () => {
      const result = prepareTemplateData([], 2);
      expect(result.characters).toEqual([]);
      expect(result.columnsClass).toBe('cols-2');
    });

    test('sets correct columnsClass for different values', () => {
      expect(prepareTemplateData([], 1).columnsClass).toBe('cols-1');
      expect(prepareTemplateData([], 2).columnsClass).toBe('cols-2');
      expect(prepareTemplateData([], 3).columnsClass).toBe('cols-3');
    });

    test('extracts edges correctly', () => {
      const edge1 = createMockItem('e1', 'Quick', 'edge');
      const edge2 = createMockItem('e2', 'Brave', 'edge');
      const actor = createMockActor('a1', 'Hero', 'character', [edge1, edge2]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].edges).toHaveLength(2);
      expect(result.characters[0].edges[0].name).toBe('Quick');
      expect(result.characters[0].edges[1].name).toBe('Brave');
    });

    test('extracts hindrances with Major severity (boolean true)', () => {
      const hindrance = createMockItem('h1', 'Overconfident', 'hindrance', { major: true });
      const actor = createMockActor('a1', 'Hero', 'character', [hindrance]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances).toHaveLength(1);
      expect(result.characters[0].hindrances[0].name).toBe('Overconfident (Major)');
    });

    test('extracts hindrances with Minor severity (boolean false)', () => {
      const hindrance = createMockItem('h1', 'Curious', 'hindrance', { major: false });
      const actor = createMockActor('a1', 'Hero', 'character', [hindrance]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances[0].name).toBe('Curious (Minor)');
    });

    test('extracts hindrances with severity string', () => {
      const hindrance = createMockItem('h1', 'Loyal', 'hindrance', { severity: 'Minor' });
      const actor = createMockActor('a1', 'Hero', 'character', [hindrance]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances[0].name).toBe('Loyal (Minor)');
    });

    test('extracts hindrances with level fallback', () => {
      const hindrance = createMockItem('h1', 'Phobia', 'hindrance', { level: 'Major' });
      const actor = createMockActor('a1', 'Hero', 'character', [hindrance]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances[0].name).toBe('Phobia (Major)');
    });

    test('handles hindrance without severity info', () => {
      const hindrance = createMockItem('h1', 'Unknown', 'hindrance', {});
      const actor = createMockActor('a1', 'Hero', 'character', [hindrance]);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances[0].name).toBe('Unknown');
    });

    test('returns null for empty edges array', () => {
      const actor = createMockActor('a1', 'Hero', 'character', []);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].edges).toBeNull();
    });

    test('returns null for empty hindrances array', () => {
      const actor = createMockActor('a1', 'Hero', 'character', []);

      const result = prepareTemplateData([actor], 2);

      expect(result.characters[0].hindrances).toBeNull();
    });

    test('handles multiple actors', () => {
      const actor1 = createMockActor('a1', 'Hero One', 'character', [
        createMockItem('e1', 'Quick', 'edge')
      ]);
      const actor2 = createMockActor('a2', 'Hero Two', 'character', [
        createMockItem('h1', 'Greedy', 'hindrance', { major: false })
      ]);

      const result = prepareTemplateData([actor1, actor2], 2);

      expect(result.characters).toHaveLength(2);
      expect(result.characters[0].name).toBe('Hero One');
      expect(result.characters[0].edges).toHaveLength(1);
      expect(result.characters[0].hindrances).toBeNull();
      expect(result.characters[1].name).toBe('Hero Two');
      expect(result.characters[1].edges).toBeNull();
      expect(result.characters[1].hindrances).toHaveLength(1);
    });
  });

  describe('calculateDialogSize', () => {
    // Recreate the calculateDialogSize logic for testing
    const calculateDialogSize = (charactersPerRow, characterCount, windowWidth = 1920, windowHeight = 1080) => {
      // Adjust card width based on columns for better readability
      let cardWidth;
      switch (charactersPerRow) {
        case 1:
          cardWidth = 400;
          break;
        case 2:
          cardWidth = 320;
          break;
        case 3:
          cardWidth = 280;
          break;
        default:
          cardWidth = 320;
      }

      const gap = 20;
      const padding = 60;
      const buttonArea = 50;

      // Calculate width based on characters per row
      const calculatedWidth = (cardWidth * charactersPerRow) + (gap * (charactersPerRow - 1)) + padding;
      const maxWidth = windowWidth * 0.95;
      const width = Math.min(calculatedWidth, maxWidth);

      // Calculate height based on number of rows needed
      const rows = Math.ceil(characterCount / charactersPerRow);
      let cardHeight;

      switch (charactersPerRow) {
        case 1:
          cardHeight = 300;
          break;
        case 2:
          cardHeight = 280;
          break;
        case 3:
          cardHeight = 260;
          break;
        default:
          cardHeight = 280;
      }

      const calculatedHeight = (cardHeight * rows) + (gap * (rows - 1)) + padding + buttonArea + 100;
      const maxHeight = windowHeight * 0.9;
      const height = Math.min(calculatedHeight, maxHeight);

      // Set minimum widths based on column count
      let minWidth;
      switch (charactersPerRow) {
        case 1:
          minWidth = 450;
          break;
        case 2:
          minWidth = 700;
          break;
        case 3:
          minWidth = 920;
          break;
        default:
          minWidth = 700;
      }

      return {
        width: Math.max(width, minWidth),
        height: Math.max(height, 350)
      };
    };

    test('calculates correct size for 1 column', () => {
      const result = calculateDialogSize(1, 2);
      expect(result.width).toBeGreaterThanOrEqual(450);
      expect(result.height).toBeGreaterThanOrEqual(350);
    });

    test('calculates correct size for 2 columns', () => {
      const result = calculateDialogSize(2, 4);
      expect(result.width).toBeGreaterThanOrEqual(700);
      expect(result.height).toBeGreaterThanOrEqual(350);
    });

    test('calculates correct size for 3 columns', () => {
      const result = calculateDialogSize(3, 6);
      expect(result.width).toBeGreaterThanOrEqual(920);
      expect(result.height).toBeGreaterThanOrEqual(350);
    });

    test('respects maximum width constraint when minWidth allows', () => {
      // For 1 column, minWidth is 450, so max constraint can apply
      const result = calculateDialogSize(1, 2, 400, 600);
      // Width should be capped by max (400 * 0.95 = 380), but minWidth (450) takes precedence
      // So we test with a window large enough to see the constraint
      const result2 = calculateDialogSize(1, 2, 600, 600);
      expect(result2.width).toBeLessThanOrEqual(600 * 0.95 + 1); // +1 for rounding
    });

    test('respects maximum height constraint', () => {
      const result = calculateDialogSize(1, 10, 1920, 600);
      expect(result.height).toBeLessThanOrEqual(600 * 0.9);
    });

    test('minimum height is 350', () => {
      const result = calculateDialogSize(2, 1);
      expect(result.height).toBeGreaterThanOrEqual(350);
    });

    test('handles zero characters', () => {
      const result = calculateDialogSize(2, 0);
      expect(result.width).toBeGreaterThanOrEqual(700);
      expect(result.height).toBe(350); // minimum height
    });

    test('height increases with more characters', () => {
      const result1 = calculateDialogSize(2, 2);
      const result2 = calculateDialogSize(2, 6);
      expect(result2.height).toBeGreaterThan(result1.height);
    });

    test('calculates rows correctly for various character counts', () => {
      // 2 chars in 2 cols = 1 row
      const result1 = calculateDialogSize(2, 2);
      // 4 chars in 2 cols = 2 rows
      const result2 = calculateDialogSize(2, 4);
      // 5 chars in 2 cols = 3 rows
      const result3 = calculateDialogSize(2, 5);

      expect(result2.height).toBeGreaterThan(result1.height);
      expect(result3.height).toBeGreaterThan(result2.height);
    });
  });
});
