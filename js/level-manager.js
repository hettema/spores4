/**
 * Manages game levels, objectives, and progression
 */
class LevelManager {
    /**
     * Create a new level manager
     * @param {Phaser.Scene} scene - The Phaser scene
     */
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.objectives = [];
        this.objectiveProgress = {};
        this.levelComplete = false;
        
        // Define all levels
        this.levels = [
            // Level 1: Tutorial
            {
                levelNumber: 1,
                name: "Tutorial",
                gridSize: 6,
                objectives: [
                    { type: "words", target: 3, description: "Form 3 words" }
                ],
                nextLevel: 2,
                tooltips: [
                    { text: "Connect letters to form words!", position: "top" },
                    { text: "Form 3 words to complete the level!", position: "bottom" }
                ]
            },
            // Level 2: Infinite Mode
            {
                levelNumber: 2,
                name: "Infinite Mode",
                gridSize: 7, // Changed from 8 to 7 for better diagonal selection
                objectives: [], // No objectives, play indefinitely
                nextLevel: null, // No next level
                tooltips: []
            }
        ];
    }
    
    /**
     * Initialize the current level
     */
    initLevel(levelNumber = 1) {
        // Set the current level
        this.currentLevel = levelNumber;
        const level = this.getLevel(levelNumber);
        
        if (!level) {
            console.error(`Level ${levelNumber} not found!`);
            return false;
        }
        
        // Reset progress
        this.levelComplete = false;
        this.objectives = [...level.objectives];
        
        // Initialize progress tracking for each objective
        this.objectiveProgress = {};
        this.objectives.forEach(objective => {
            this.objectiveProgress[objective.type] = 0;
        });
        
        console.log(`Initialized Level ${levelNumber}: ${level.name}`);
        return true;
    }
    
    /**
     * Get level definition by number
     * @param {number} levelNumber - Level number
     * @returns {Object} Level definition
     */
    getLevel(levelNumber) {
        return this.levels.find(level => level.levelNumber === levelNumber);
    }
    
    /**
     * Get the current level definition
     * @returns {Object} Current level definition
     */
    getCurrentLevel() {
        return this.getLevel(this.currentLevel);
    }
    
    /**
     * Update progress for an objective type
     * @param {string} type - Objective type (e.g., "words", "cascade", "score")
     * @param {number} value - Value to add to progress
     */
    updateProgress(type, value = 1) {
        // If this level doesn't track this objective type, ignore
        if (!this.objectives.some(obj => obj.type === type)) {
            return;
        }
        
        // Update the progress
        if (this.objectiveProgress[type] !== undefined) {
            this.objectiveProgress[type] += value;
            console.log(`Progress updated for ${type}: ${this.objectiveProgress[type]}`);
        }
        
        // Check if we've completed the level
        this.checkLevelComplete();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Set absolute progress for an objective type (mainly for score)
     * @param {string} type - Objective type (generally "score")
     * @param {number} value - Absolute value to set
     */
    setProgress(type, value) {
        // If this level doesn't track this objective type, ignore
        if (!this.objectives.some(obj => obj.type === type)) {
            return;
        }
        
        // Set the progress
        if (this.objectiveProgress[type] !== undefined) {
            this.objectiveProgress[type] = value;
            console.log(`Progress set for ${type}: ${value}`);
        }
        
        // Check if we've completed the level
        this.checkLevelComplete();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Check if all objectives are complete
     * @returns {boolean} True if level is complete
     */
    checkLevelComplete() {
        // Infinite levels are never "complete"
        if (this.objectives.length === 0) {
            return false;
        }
        
        // Check each objective
        const allComplete = this.objectives.every(objective => {
            const progress = this.objectiveProgress[objective.type] || 0;
            return progress >= objective.target;
        });
        
        // If we just completed the level, trigger the completion
        if (allComplete && !this.levelComplete) {
            this.levelComplete = true;
            this.onLevelComplete();
        }
        
        return allComplete;
    }
    
    /**
     * Handle level completion
     */
    onLevelComplete() {
        console.log(`Level ${this.currentLevel} complete!`);
        
        // Get the current level to find the next level
        const currentLevel = this.getLevel(this.currentLevel);
        
        // If this is level 1 (tutorial), mark it as completed in localStorage
        if (this.currentLevel === 1) {
            localStorage.setItem('sporesCompletedLevel1', 'true');
            console.log('Tutorial completed, saved to localStorage');
        }
        
        // Show completion UI with delay to let final animations complete
        this.scene.time.delayedCall(1000, () => {
            this.showLevelCompleteUI(currentLevel.nextLevel);
        });
    }
    
    /**
     * Create UI elements for objectives
     */
    createUI() {
        // Create container for objectives
        this.objectivesContainer = document.createElement('div');
        this.objectivesContainer.className = 'objectives-container';
        this.objectivesContainer.style.position = 'absolute';
        this.objectivesContainer.style.top = '10px';
        this.objectivesContainer.style.left = '10px';
        this.objectivesContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.objectivesContainer.style.color = 'white';
        this.objectivesContainer.style.padding = '10px';
        this.objectivesContainer.style.borderRadius = '5px';
        this.objectivesContainer.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(this.objectivesContainer);
        
        // Create level title
        this.levelTitle = document.createElement('div');
        this.levelTitle.className = 'level-title';
        this.levelTitle.style.fontWeight = 'bold';
        this.levelTitle.style.marginBottom = '5px';
        this.objectivesContainer.appendChild(this.levelTitle);
        
        // Create objective list
        this.objectiveList = document.createElement('ul');
        this.objectiveList.style.listStyleType = 'none';
        this.objectiveList.style.padding = '0';
        this.objectiveList.style.margin = '0';
        this.objectivesContainer.appendChild(this.objectiveList);
        
        // Update with current level info
        this.updateUI();
    }
    
    /**
     * Update the objectives UI
     */
    updateUI() {
        const level = this.getLevel(this.currentLevel);
        if (!level) return;
        
        // Update level title
        if (this.levelTitle) {
            this.levelTitle.textContent = `Level ${level.levelNumber}: ${level.name}`;
        }
        
        // Clear and rebuild objective list
        if (this.objectiveList) {
            this.objectiveList.innerHTML = '';
            
            level.objectives.forEach(objective => {
                const progress = this.objectiveProgress[objective.type] || 0;
                const isComplete = progress >= objective.target;
                
                const li = document.createElement('li');
                li.style.marginBottom = '3px';
                
                // Checkmark for completed objectives
                if (isComplete) {
                    li.innerHTML = `✅ ${objective.description} (${progress}/${objective.target})`;
                    li.style.color = '#8eff8e';
                } else {
                    li.innerHTML = `⬜ ${objective.description} (${progress}/${objective.target})`;
                }
                
                this.objectiveList.appendChild(li);
            });
            
            // Handle infinite mode differently
            if (level.objectives.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = `Keep playing to achieve the highest score!`;
                this.objectiveList.appendChild(li);
            }
        }
    }
    
    /**
     * Show the level complete UI
     * @param {number|null} nextLevel - Next level number, or null if no next level
     */
    showLevelCompleteUI(nextLevel) {
        // Make sure any existing UI is removed first
        document.querySelectorAll('.level-complete-container').forEach(el => el.remove());
        
        // Create level complete container
        const container = document.createElement('div');
        container.className = 'level-complete-container';
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        container.style.color = 'white';
        container.style.padding = '20px';
        container.style.borderRadius = '10px';
        container.style.textAlign = 'center';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        container.style.minWidth = '300px';
        container.style.zIndex = '1000';
        
        // Create level complete title
        const title = document.createElement('h2');
        title.textContent = 'Level Complete!';
        title.style.color = '#ffff00';
        title.style.marginTop = '0';
        container.appendChild(title);
        
        // Show score
        const score = document.createElement('p');
        score.textContent = `Score: ${this.scene.score}`;
        score.style.fontSize = '20px';
        container.appendChild(score);
        
        // Create buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        container.appendChild(buttonContainer);
        
        // Only show "Next Level" if there is a next level
        if (nextLevel !== null) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next Level';
            nextButton.style.padding = '10px 20px';
            nextButton.style.marginRight = '10px';
            nextButton.style.background = '#4caf50';
            nextButton.style.border = 'none';
            nextButton.style.borderRadius = '5px';
            nextButton.style.color = 'white';
            nextButton.style.fontSize = '16px';
            nextButton.style.cursor = 'pointer';
            
            nextButton.onclick = () => {
                container.remove();
                this.startNextLevel();
            };
            
            buttonContainer.appendChild(nextButton);
        }
        
        // Always show "Restart" button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Level';
        restartButton.style.padding = '10px 20px';
        restartButton.style.background = '#2196f3';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.color = 'white';
        restartButton.style.fontSize = '16px';
        restartButton.style.cursor = 'pointer';
        
        restartButton.onclick = () => {
            container.remove();
            this.restartLevel();
        };
        
        buttonContainer.appendChild(restartButton);
        
        // Add to document
        document.body.appendChild(container);
    }
    
    /**
     * Start the next level with a full game restart
     */
    startNextLevel() {
        const currentLevel = this.getLevel(this.currentLevel);
        if (currentLevel && currentLevel.nextLevel) {
            console.log(`Transitioning from level ${this.currentLevel} to level ${currentLevel.nextLevel}`);
            
            // First cleanup all UI elements
            this.cleanup();
            
            // Set the next level
            const nextLevelNumber = currentLevel.nextLevel;
            
            // Completely restart the game scene to ensure a clean state
            this.resetGame(nextLevelNumber);
        }
    }
    
    /**
     * Reset the entire game to a specific level
     * @param {number} levelNumber - The level to reset to
     */
    resetGame(levelNumber) {
        // Initialize the level data
        this.initLevel(levelNumber);
        
        // Completely reload the page for a clean state
        setTimeout(() => {
            // Store the desired level in session storage
            sessionStorage.setItem('sporesLevel', levelNumber.toString());
            
            // Reload the page
            window.location.reload();
        }, 100);
    }
    
    /**
     * Restart the current level
     */
    restartLevel() {
        this.resetGame(this.currentLevel);
    }
    
    /**
     * Display tooltips for the current level
     */
    showTooltips() {
        const level = this.getLevel(this.currentLevel);
        if (!level || !level.tooltips || level.tooltips.length === 0) {
            return;
        }
        
        // Clear any existing tooltips
        document.querySelectorAll('.game-tooltip').forEach(el => el.remove());
        
        // Create tooltips with delay between each
        level.tooltips.forEach((tooltip, index) => {
            this.scene.time.delayedCall(index * 2000, () => {
                this.createTooltip(tooltip.text, tooltip.position);
            });
        });
    }
    
    /**
     * Create a single tooltip
     * @param {string} text - Tooltip text
     * @param {string} position - Position ('top', 'bottom', 'left', 'right')
     */
    createTooltip(text, position = 'bottom') {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'game-tooltip';
        tooltip.textContent = text;
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px 15px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.fontFamily = 'Arial, sans-serif';
        tooltip.style.fontSize = '16px';
        tooltip.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        tooltip.style.zIndex = '1000';
        tooltip.style.transition = 'opacity 0.5s';
        tooltip.style.opacity = '0';
        
        // Position the tooltip
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        const gameCanvas = document.querySelector('canvas');
        const gameRect = gameCanvas.getBoundingClientRect();
        
        switch (position) {
            case 'top':
                tooltip.style.bottom = `${window.innerHeight - gameRect.top + 10}px`;
                tooltip.style.left = `${gameRect.left + gameWidth / 2}px`;
                tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                tooltip.style.top = `${gameRect.top + gameHeight + 10}px`;
                tooltip.style.left = `${gameRect.left + gameWidth / 2}px`;
                tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                tooltip.style.top = `${gameRect.top + gameHeight / 2}px`;
                tooltip.style.right = `${window.innerWidth - gameRect.left + 10}px`;
                tooltip.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                tooltip.style.top = `${gameRect.top + gameHeight / 2}px`;
                tooltip.style.left = `${gameRect.left + gameWidth + 10}px`;
                tooltip.style.transform = 'translateY(-50%)';
                break;
        }
        
        // Add to document
        document.body.appendChild(tooltip);
        
        // Fade in
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 500);
        }, 5000);
    }
    
    /**
     * Clean up all UI elements
     */
    cleanup() {
        if (this.objectivesContainer) {
            this.objectivesContainer.remove();
        }
        
        document.querySelectorAll('.game-tooltip').forEach(el => el.remove());
    }
}
