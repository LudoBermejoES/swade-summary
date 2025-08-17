/**
 * SWADE Summary Module
 * Author: Ludo Bermejo (ludobermejo@gmail.com)
 * A module for providing character and game summaries in the SWADE system
 */

Hooks.once('init', async function() {
    console.log('SWADE Summary | Initializing SWADE Summary module');
    
    // Register module settings
    game.settings.register('swade-summary', 'enable-summaries', {
        name: game.i18n.localize('swade-summary.settings.enable-summaries.name'),
        hint: game.i18n.localize('swade-summary.settings.enable-summaries.hint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    
    game.settings.register('swade-summary', 'selected-characters', {
        name: 'Selected Characters',
        hint: 'Comma-separated list of character names or IDs to display in summary',
        scope: 'world',
        config: true,
        type: String,
        default: ''
    });
    
    game.settings.register('swade-summary', 'button-position', {
        name: 'Button Position',
        hint: 'Position of the summary button on screen',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'top-left': 'Top Left',
            'top-right': 'Top Right',
            'bottom-left': 'Bottom Left',
            'bottom-right': 'Bottom Right'
        },
        default: 'top-right'
    });
    
    game.settings.register('swade-summary', 'characters-per-row', {
        name: game.i18n.localize('swade-summary.settings.characters-per-row.name'),
        hint: game.i18n.localize('swade-summary.settings.characters-per-row.hint'),
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 1,
            max: 3,
            step: 1
        },
        default: 2
    });
});

Hooks.once('ready', async function() {
    console.log('SWADE Summary | SWADE Summary module ready');
    
    // Only run if SWADE system is active
    if (game.system.id !== 'swade') {
        console.warn('SWADE Summary | This module only works with the SWADE system');
        return;
    }
    
    // Initialize module functionality
    SWADESummary.init();
});

// Update button position when setting changes
Hooks.on('updateSetting', (setting) => {
    if (setting.key === 'swade-summary.button-position') {
        SWADESummary.updateButtonPosition();
    }
});

/**
 * Main SWADE Summary class
 */
class SWADESummary {
    static summaryButton = null;
    
    static init() {
        console.log('SWADE Summary | Initializing summary functionality');
        
        // Add floating summary button to screen
        this.addFloatingButton();
    }
    
    static addFloatingButton() {
        if (!game.settings.get('swade-summary', 'enable-summaries')) return;
        
        const position = game.settings.get('swade-summary', 'button-position');
        
        this.summaryButton = $(`
            <div id="swade-summary-float-btn" class="swade-summary-float-btn ${position}">
                <button type="button" title="Character Summary">
                    <i class="fas fa-users"></i>
                </button>
            </div>
        `);
        
        this.summaryButton.on('click', () => {
            this.showSelectedCharactersSummary();
        });
        
        $('body').append(this.summaryButton);
    }
    
    static updateButtonPosition() {
        if (this.summaryButton) {
            const position = game.settings.get('swade-summary', 'button-position');
            this.summaryButton.removeClass('top-left top-right bottom-left bottom-right');
            this.summaryButton.addClass(position);
        }
    }
    
    static async showSelectedCharactersSummary() {
        const selectedCharacters = this.getSelectedCharacters();
        const charactersPerRow = game.settings.get('swade-summary', 'characters-per-row');
        const templateData = this.prepareTemplateData(selectedCharacters, charactersPerRow);
        
        const content = await renderTemplate('modules/swade-summary/templates/character-summary.hbs', templateData);
        
        // Calculate dialog size based on characters per row
        const dialogSize = this.calculateDialogSize(charactersPerRow, selectedCharacters.length);
        
        new Dialog({
            title: `${game.i18n.localize('swade-summary.ui.characters-summary')}`,
            content: content,
            buttons: {
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('swade-summary.ui.close')
                }
            },
            default: 'close',
            width: dialogSize.width,
            height: dialogSize.height
        }).render(true);
    }
    
    static getSelectedCharacters() {
        const selectedString = game.settings.get('swade-summary', 'selected-characters');
        if (!selectedString.trim()) return [];
        
        const identifiers = selectedString.split(',').map(s => s.trim()).filter(s => s);
        const characters = [];
        
        for (const identifier of identifiers) {
            // Try to find by ID first
            let actor = game.actors.get(identifier);
            
            // If not found by ID, try by name
            if (!actor) {
                actor = game.actors.find(a => a.name.toLowerCase() === identifier.toLowerCase() && a.type === 'character');
            }
            
            if (actor && actor.type === 'character') {
                characters.push(actor);
            }
        }
        
        return characters;
    }
    
    static prepareTemplateData(selectedCharacters, charactersPerRow) {
        const characters = selectedCharacters.map(actor => {
            const edges = actor.items.filter(i => i.type === 'edge').map(edge => ({
                name: edge.name,
                id: edge.id
            }));
            
            const hindrances = actor.items.filter(i => i.type === 'hindrance').map(hindrance => ({
                name: hindrance.name,
                id: hindrance.id
            }));
            
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
    }
    
    static calculateDialogSize(charactersPerRow, characterCount) {
        // Base card width: ~280px, gap: 20px, padding: 30px
        const cardWidth = 280;
        const gap = 20;
        const padding = 60; // 30px each side
        const buttonArea = 50; // Space for close button
        
        // Calculate width based on characters per row
        const width = Math.min(
            (cardWidth * charactersPerRow) + (gap * (charactersPerRow - 1)) + padding,
            window.innerWidth * 0.9 // Max 90% of screen width
        );
        
        // Calculate height based on number of rows needed
        const rows = Math.ceil(characterCount / charactersPerRow);
        const cardHeight = 200; // Approximate card height
        const height = Math.min(
            (cardHeight * rows) + (gap * (rows - 1)) + padding + buttonArea + 80, // +80 for title
            window.innerHeight * 0.8 // Max 80% of screen height
        );
        
        return {
            width: Math.max(width, 400), // Minimum width
            height: Math.max(height, 300) // Minimum height
        };
    }
}

// Export for global access
window.SWADESummary = SWADESummary;