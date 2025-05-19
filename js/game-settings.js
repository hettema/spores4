/**
 * Game Settings Panel for adjusting gameplay parameters during testing
 */
class GameSettings {
    /**
     * Create a new settings panel
     * @param {Phaser.Scene} scene - The Phaser scene
     */
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.container = null;
        this.settings = {
            sporeCount: 8,           // Base number of spores released per explosion
            sporeThreshold: 2,       // Number of spores needed to trigger an explosion
            sporeDistribution: 1.5,  // Controls how widely spores are distributed
            wordLengthFactor: 1.5    // Multiplier for word length bonus (6+ letters)
        };
        
        // Create the settings panel
        this.createPanel();
    }
    
    /**
     * Create the settings panel HTML elements
     */
    createPanel() {
        // Create a container div for the panel
        this.container = document.createElement('div');
        this.container.id = 'game-settings-panel';
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.width = '250px';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(20, 40, 20, 0.85)';
        this.container.style.color = '#eeffee';
        this.container.style.borderRadius = '10px';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.fontSize = '14px';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none';
        this.container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        this.container.style.backdropFilter = 'blur(5px)';
        this.container.style.transition = 'all 0.3s ease';
        
        // Create header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '15px';
        
        const title = document.createElement('h3');
        title.textContent = 'Game Settings';
        title.style.margin = '0';
        title.style.color = '#aaffaa';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.backgroundColor = 'rgba(80, 120, 80, 0.7)';
        closeButton.style.border = 'none';
        closeButton.style.color = '#ffffff';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.width = '24px';
        closeButton.style.height = '24px';
        
        closeButton.addEventListener('click', () => {
            this.toggle();
        });
        
        header.appendChild(title);
        header.appendChild(closeButton);
        this.container.appendChild(header);
        
        // Create sliders for each setting
        this.createSlider('sporeCount', 'Spore Count', 1, 10, this.settings.sporeCount, 1);
        this.createSlider('sporeThreshold', 'Spore Threshold', 2, 10, this.settings.sporeThreshold, 1);
        this.createSlider('sporeDistribution', 'Distribution Range', 1, 5, this.settings.sporeDistribution, 0.5);
        this.createSlider('wordLengthFactor', 'Word Length Bonus', 1, 3, this.settings.wordLengthFactor, 0.1);
        
        // Create reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset to Defaults';
        resetButton.style.backgroundColor = 'rgba(80, 120, 80, 0.7)';
        resetButton.style.border = 'none';
        resetButton.style.color = '#ffffff';
        resetButton.style.padding = '8px 12px';
        resetButton.style.borderRadius = '4px';
        resetButton.style.cursor = 'pointer';
        resetButton.style.width = '100%';
        resetButton.style.marginTop = '15px';
        
        resetButton.addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        this.container.appendChild(resetButton);
        
        // Add the panel to the DOM
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.container);
        } else {
            document.body.appendChild(this.container);
        }
        
        // Create toggle button
        this.createToggleButton();
    }
    
    /**
     * Create a slider for a specific setting
     * @param {string} settingKey - The setting key in the settings object
     * @param {string} label - The label to display
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} value - Current value
     * @param {number} step - Step increment
     */
    createSlider(settingKey, label, min, max, value, step) {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.marginBottom = '15px';
        
        // Create label with value display
        const labelElement = document.createElement('div');
        labelElement.style.display = 'flex';
        labelElement.style.justifyContent = 'space-between';
        labelElement.style.marginBottom = '5px';
        
        const labelText = document.createElement('span');
        labelText.textContent = label;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.id = `${settingKey}-value`;
        valueDisplay.textContent = value;
        valueDisplay.style.fontWeight = 'bold';
        valueDisplay.style.color = '#aaffaa';
        
        labelElement.appendChild(labelText);
        labelElement.appendChild(valueDisplay);
        
        // Create slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.step = step;
        slider.style.width = '100%';
        slider.style.height = '8px';
        slider.style.accentColor = '#66aa66';
        
        // Update value when slider changes
        slider.addEventListener('input', (e) => {
            const newValue = parseFloat(e.target.value);
            valueDisplay.textContent = newValue;
            this.settings[settingKey] = newValue;
            
            // Emit event to update game parameters
            this.emitSettingsChanged();
        });
        
        sliderContainer.appendChild(labelElement);
        sliderContainer.appendChild(slider);
        
        this.container.appendChild(sliderContainer);
    }
    
    /**
     * Create a button to toggle the settings panel
     */
    createToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '⚙️';
        toggleButton.id = 'settings-toggle-button';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.backgroundColor = 'rgba(40, 80, 40, 0.8)';
        toggleButton.style.color = '#ffffff';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.width = '40px';
        toggleButton.style.height = '40px';
        toggleButton.style.fontSize = '20px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '1001';
        toggleButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
        
        toggleButton.addEventListener('click', () => {
            this.toggle();
        });
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(toggleButton);
        } else {
            document.body.appendChild(toggleButton);
        }
    }
    
    /**
     * Toggle the visibility of the settings panel
     */
    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
    }
    
    /**
     * Reset all settings to default values
     */
    resetToDefaults() {
        const defaults = {
            sporeCount: 8,
            sporeThreshold: 2,
            sporeDistribution: 1.5,
            wordLengthFactor: 1.5
        };
        
        // Update settings object
        this.settings = { ...defaults };
        
        // Update all slider values
        for (const [key, value] of Object.entries(defaults)) {
            const slider = this.container.querySelector(`input[type=range]#${key}`);
            const valueDisplay = document.getElementById(`${key}-value`);
            
            if (slider) {
                slider.value = value;
            }
            
            if (valueDisplay) {
                valueDisplay.textContent = value;
            }
        }
        
        // Emit event to update game parameters
        this.emitSettingsChanged();
    }
    
    /**
     * Emit a custom event when settings change
     */
    emitSettingsChanged() {
        const event = new CustomEvent('game-settings-changed', {
            detail: { settings: this.settings }
        });
        document.dispatchEvent(event);
        
        // Also update Phaser scene's settings
        if (this.scene && this.scene.grid) {
            // Update grid parameters
            this.scene.grid.updateGameParameters(this.settings);
        }
    }
    
    /**
     * Get current settings
     * @returns {Object} Current settings object
     */
    getSettings() {
        return { ...this.settings };
    }
}
