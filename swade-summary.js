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
        
        const dialog = new Dialog({
            title: `${game.i18n.localize('swade-summary.ui.characters-summary')}`,
            content: content,
            buttons: {
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('swade-summary.ui.close')
                }
            },
            default: 'close'
        }, {
            width: dialogSize.width,
            height: dialogSize.height,
            resizable: true,
            classes: [`swade-summary-dialog`, `cols-${charactersPerRow}`]
        });
        
        // Add event listeners after rendering
        dialog.render(true);
        
        // Wait for the dialog to be rendered then add click handlers
        setTimeout(() => {
            this.addItemClickHandlers(dialog);
        }, 100);
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
        // Adjust card width based on columns for better readability
        let cardWidth;
        switch(charactersPerRow) {
            case 1:
                cardWidth = 400; // Wide cards for single column
                break;
            case 2:
                cardWidth = 320; // Medium cards for two columns
                break;
            case 3:
                cardWidth = 280; // Narrower but still readable for three columns
                break;
        }
        
        const gap = 20;
        const padding = 60; // 30px each side
        const buttonArea = 50; // Space for close button
        
        // Calculate width based on characters per row
        const calculatedWidth = (cardWidth * charactersPerRow) + (gap * (charactersPerRow - 1)) + padding;
        const maxWidth = window.innerWidth * 0.95; // Allow up to 95% of screen width
        const width = Math.min(calculatedWidth, maxWidth);
        
        // Calculate height based on number of rows needed - be more generous with height
        const rows = Math.ceil(characterCount / charactersPerRow);
        let cardHeight;
        
        // Estimate card height based on average content
        switch(charactersPerRow) {
            case 1:
                cardHeight = 300; // Taller for single wide cards
                break;
            case 2:
                cardHeight = 280; // Medium height for two columns
                break;
            case 3:
                cardHeight = 260; // Shorter but allow for text wrapping
                break;
        }
        
        const calculatedHeight = (cardHeight * rows) + (gap * (rows - 1)) + padding + buttonArea + 100; // +100 for title and margins
        const maxHeight = window.innerHeight * 0.9; // Allow up to 90% of screen height
        const height = Math.min(calculatedHeight, maxHeight);
        
        // Set minimum widths based on column count
        let minWidth;
        switch(charactersPerRow) {
            case 1:
                minWidth = 450;
                break;
            case 2:
                minWidth = 700;
                break;
            case 3:
                minWidth = 920; // Ensure 3 columns have enough space
                break;
        }
        
        return {
            width: Math.max(width, minWidth),
            height: Math.max(height, 350)
        };
    }
    
    static addItemClickHandlers(dialog) {
        const element = dialog.element;
        if (!element) return;
        
        // Add click handlers for item links
        element.find('.item-link').on('click', (event) => {
            event.preventDefault();
            const $target = $(event.currentTarget);
            const itemId = $target.data('item-id');
            const actorId = $target.data('actor-id');
            
            this.showItemDescription(itemId, actorId);
        });
    }
    
    static showItemDescription(itemId, actorId) {
        const actor = game.actors.get(actorId);
        if (!actor) {
            ui.notifications.error('Actor not found');
            return;
        }
        
        const item = actor.items.get(itemId);
        if (!item) {
            ui.notifications.error('Item not found');
            return;
        }
        
        // Get item description
        const description = item.system.description || 'No description available';
        
        // Create description dialog
        new Dialog({
            title: item.name,
            content: `
                <div class="item-description">
                    <h3>${item.name}</h3>
                    <div class="description-content">
                        ${description}
                    </div>
                </div>
            `,
            buttons: {
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('swade-summary.ui.close')
                }
            },
            default: 'close'
        }, {
            width: 400,
            height: 300,
            resizable: true,
            classes: ['swade-item-description']
        }).render(true);
    }
}

// Export for global access
window.SWADESummary = SWADESummary;