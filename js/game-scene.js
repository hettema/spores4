/**
 * Main game scene that handles the game logic
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        this.score = 0;
        // Create a single instance of the word validator for the entire game
        this.wordValidator = new WordValidator();
        
        // Track gameplay statistics
        this.stats = {
            wordsFormed: 0,
            cascadesCreated: 0
        };
    }
    
    create() {
        // Start loading the dictionary immediately
        this.wordValidator.loadDictionary();
        
        // Create the level manager and initialize level 1
        this.levelManager = new LevelManager(this);
        this.levelManager.initLevel(1);
        
        // Create mycelium background
        const bgColor = 0x0a1a0a; // Dark green base
        const bg = this.add.rectangle(400, 300, 800, 600, bgColor).setOrigin(0.5);
        
        // Add enhanced mycelium pattern texture
        this.createEnhancedMyceliumBackground();
        
        // Add ambient spore particles floating in the background
        this.createAmbientSpores();
        
        // Create wooden frame for UI
        this.createWoodenUIFrame();
        
        // Create score display with better contrast
        this.scoreText = this.add.text(50, 35, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
            stroke: '#225522',
            strokeThickness: 2,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setOrigin(0, 0.5);
        
        // Create word display with mushroom style
        this.wordText = this.add.text(400, 75, '', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#eeffee',
            stroke: '#114411',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5, 0.5);
        
        // Add dictionary status text
        this.dictStatusText = this.add.text(400, 60, 'Loading dictionary...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaddaa',
            stroke: '#113311',
            strokeThickness: 1
        }).setOrigin(0.5, 0);
        
        // Update dictionary status every second
        this.time.addEvent({
            delay: 1000,
            callback: this.updateDictionaryStatus,
            callbackScope: this,
            loop: true
        });
        
        // Calculate grid size based on game dimensions
        const gridSize = Math.min(this.cameras.main.width, this.cameras.main.height) * 0.8;
        const gridX = (this.cameras.main.width - gridSize) / 2;
        const gridY = 100;
        
        // Create the game grid with appropriate grid size from level manager
        const level = this.levelManager.getCurrentLevel();
        this.grid = new Grid(this, gridX, gridY, gridSize, gridSize, level.gridSize);
        
        // Set up event listeners
        this.events.on('wordSelected', this.onWordSelected, this);
        this.events.on('invalidWord', this.onInvalidWord, this);
        this.events.on('tilesExploded', this.onTilesExploded, this);
        
        // Initialize local storage if needed
        this.initLocalStorage();
        
        // Create game settings panel
        this.gameSettings = new GameSettings(this);

        // Create level objectives UI
        this.levelManager.createUI();

        // Create word hint UI
        this.createHintUI();
        this.updateHintWords();

        // Show tooltips for the tutorial level
        this.levelManager.showTooltips();
    }
    
    /**
     * Update the dictionary status text
     */
    updateDictionaryStatus() {
        if (this.wordValidator.loaded) {
            this.dictStatusText.setText(`Dictionary loaded: ${this.wordValidator.dictionary.size} words`);
            this.dictStatusText.setColor('#007700');
            // Hide after 3 seconds
            this.time.delayedCall(3000, () => {
                this.dictStatusText.setVisible(false);
            });
        } else if (this.wordValidator.loading) {
            this.dictStatusText.setText('Loading dictionary...');
            this.dictStatusText.setColor('#ff8800');
        } else {
            this.dictStatusText.setText('Dictionary failed to load!');
            this.dictStatusText.setColor('#cc0000');
        }
    }
    
    /**
     * Initialize local storage for saving game state
     */
    initLocalStorage() {
        if (localStorage.getItem('sporesHighScore') === null) {
            localStorage.setItem('sporesHighScore', '0');
        }
        
        // Display high score with improved styling to match score display
        const highScore = parseInt(localStorage.getItem('sporesHighScore'));
        this.add.text(750, 35, `High Score: ${highScore}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
            stroke: '#225522',
            strokeThickness: 2,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setOrigin(1, 0.5);
    }
    
    /**
     * Update function called each frame
     */
    update() {
        // Safety check - make sure grid exists and is properly initialized
        if (!this.grid || !this.grid.selectedTiles) {
            return;
        }
        
        // Update the grid (for path drawing)
        if (this.grid.update) {
            this.grid.update();
        }
        
        try {
            // Get the current word from selected tiles
            if (this.grid.selectedTiles.length > 0) {
                // Safety check for word validator
                if (!this.wordValidator || !this.wordValidator.getWordFromTiles) {
                    return;
                }
                
                const word = this.wordValidator.getWordFromTiles(this.grid.selectedTiles);
                this.wordText.setText(word);
                
                // Show validity status
                if (this.grid.selectedTiles.length >= 3) {
                    // Check if it's a valid word
                    if (this.wordValidator.dictionary && this.wordValidator.dictionary.size > 0) {
                        const isValid = this.wordValidator.isValid(word);
                        if (isValid) {
                            this.wordText.setColor('#007700'); // Valid (green)
                        } else {
                            this.wordText.setColor('#cc0000'); // Invalid (red)
                        }
                    } else {
                        // Dictionary not loaded yet, show as provisional
                        this.wordText.setColor('#ffaa00'); // Orange - dictionary loading
                    }
                } else {
                    this.wordText.setColor('#770000'); // Too short (red)
                }
            } else {
                this.wordText.setText('');
            }
        } catch (error) {
            console.error("Error in update:", error);
            // Clear word text on error to avoid stale display
            if (this.wordText) {
                this.wordText.setText('');
            }
        }
    }
    
    /**
     * Handle word selection event
     * @param {string} word - The selected word
     * @param {number} score - The word score
     */
    onWordSelected(word, score) {
        // Add to player score
        this.score += score;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Update stats
        this.stats.wordsFormed++;
        
        // Update level manager progress
        this.levelManager.updateProgress('words', 1);
        this.levelManager.setProgress('score', this.score);
        
        // Display word briefly
        this.wordText.setText(word);
        this.wordText.setColor('#007700');
        this.tweens.add({
            targets: this.wordText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.wordText.setText('');
            }
        });

        // Check if this word was one of the hints
        this.checkHintWord(word);
        
        // Update high score if needed
        const highScore = parseInt(localStorage.getItem('sporesHighScore'));
        if (this.score > highScore) {
            localStorage.setItem('sporesHighScore', this.score.toString());
        }

    }
    
    /**
     * Handle tiles exploded event
     * @param {number} count - Number of tiles exploded
     * @param {number} cascades - Number of cascade explosions
     */
    onTilesExploded(count, cascades) {
        // Add cascade bonus (only if there were actual cascades)
        if (cascades > 0) {
            // Update stats
            this.stats.cascadesCreated += cascades;
            
            // Update level manager progress
            this.levelManager.updateProgress('cascade', cascades);
            
            const cascadeBonus = cascades * 15; // Increased to 15 points per cascade
            this.score += cascadeBonus;
            this.scoreText.setText(`Score: ${this.score}`);
            this.levelManager.setProgress('score', this.score);
            
            // Display cascade bonus message
            const bonusText = this.add.text(400, 70, `Cascade Bonus: +${cascadeBonus}`, {
                fontFamily: 'Arial',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ff7700'
            }).setOrigin(0.5, 0);
            
            // Animate and remove after a delay
            this.tweens.add({
                targets: bonusText,
                y: '+= 30',
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    bonusText.destroy();
                }
            });
        }
        
        // Spore overload bonus (3+ tiles in one cascade)
        if (cascades >= 3) {
            const overloadBonus = 50; // 50 points for spore overload
            this.score += overloadBonus;
            this.scoreText.setText(`Score: ${this.score}`);
            this.levelManager.setProgress('score', this.score);
            
            // Display overload bonus message
            const overloadText = this.add.text(400, 100, `Spore Overload: +${overloadBonus}`, {
                fontFamily: 'Arial',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#aa00ff'
            }).setOrigin(0.5, 0);
            
            // Animate and remove after a delay
            this.tweens.add({
                targets: overloadText,
                y: '+= 40',
                alpha: 0,
                duration: 2000,
                onComplete: () => {
                    overloadText.destroy();
                }
            });
        }
        
        // Max cascade bonus (if we hit the limit)
        if (cascades >= 8) {
            const maxCascadeBonus = 100; // Bonus for reaching max cascade limit
            this.score += maxCascadeBonus;
            this.levelManager.setProgress('score', this.score);
            
            // Display max cascade bonus message
            const maxCascadeText = this.add.text(400, 140, `MAX CASCADE: +${maxCascadeBonus}!`, {
                fontFamily: 'Arial',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ff00ff'
            }).setOrigin(0.5, 0);
            
            // Animate and remove after a delay
            this.tweens.add({
                targets: maxCascadeText,
                y: '+= 50',
                alpha: 0,
                duration: 2500,
                onComplete: () => {
                    maxCascadeText.destroy();
                }
            });
        }
        
        // Update high score if needed
        const highScore = parseInt(localStorage.getItem('sporesHighScore'));
        if (this.score > highScore) {
            localStorage.setItem('sporesHighScore', this.score.toString());
        }

        // Refresh hints after the board changes
        this.time.delayedCall(400, () => {
            this.updateHintWords();
        });
    }
    
    /**
     * Handle invalid word selection
     * @param {string} word - The invalid word
     */
    onInvalidWord(word) {
        // Display the invalid word in red
        this.wordText.setText(word);
        this.wordText.setColor('#cc0000');
        
        // Show an error message
        const invalidText = this.add.text(400, 70, 'Not in dictionary!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#cc0000'
        }).setOrigin(0.5, 0);
        
        // Animate the text
        this.tweens.add({
            targets: [this.wordText, invalidText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Remove the error message after a delay
                this.tweens.add({
                    targets: invalidText,
                    alpha: 0,
                    y: '+=20',
                    duration: 500,
                    onComplete: () => {
                        invalidText.destroy();
                        this.wordText.setText('');
                    }
                });
            }
        });
        
        // Play error sound (if available)
        // this.sound.play('error');
    }
    
    /**
     * Create mycelium background pattern
     */
    createMyceliumBackground() {
        const myceliumKey = 'mycelium_bg';
        
        try {
            // Generate a procedural mycelium texture if it doesn't exist
            if (!this.textures.exists(myceliumKey)) {
                const graphics = this.add.graphics();
                const width = 800;
                const height = 600;
                
                // Base color - now richer dark green
                const baseColor = 0x0e1d0e; // Deeper, richer dark green
                
                // Draw base
                graphics.fillStyle(baseColor);
                graphics.fillRect(0, 0, width, height);
                
                // Add a subtle gradient overlay
                for (let y = 0; y < height; y += 10) {
                    const gradientAlpha = 0.02 + (y / height) * 0.08; // Subtle gradient
                    graphics.fillStyle(0x0a150a, gradientAlpha);
                    graphics.fillRect(0, y, width, 10);
                }
                
                // Draw mycelium tendrils - more of them for a denser network
                const lineCount = 60; // Increased number of mycelium lines/branches
                
                for (let i = 0; i < lineCount; i++) {
                    // Random starting position
                    const startX = Phaser.Math.Between(0, width);
                    const startY = Phaser.Math.Between(0, height);
                    
                    // Generate a random path with 4-8 segments for longer, more complex paths
                    const segments = Phaser.Math.Between(4, 8);
                    let x = startX;
                    let y = startY;
                    
                    // Random color variation with more varied and realistic mycelium colors
                    const lineAlpha = Phaser.Math.FloatBetween(0.08, 0.25); // Increased visibility
                    const hueVariation = Phaser.Math.Between(-20, 20);
                    const lineColor = Phaser.Utils.Array.GetRandom([
                        0x70c070 + hueVariation, // Green
                        0x60b080 + hueVariation, // Blue-green
                        0x80c050 + hueVariation, // Yellow-green
                        0x90d080 + hueVariation  // Bright green
                    ]);
                    
                    // Vary line thickness more for natural look
                    const lineThickness = Phaser.Math.FloatBetween(0.5, 2.5);
                    
                    graphics.lineStyle(lineThickness, lineColor, lineAlpha);
                    graphics.beginPath();
                    graphics.moveTo(x, y);
                    
                    // Create more natural, organic branching patterns
                    let previousAngle = 0;
                    for (let j = 0; j < segments; j++) {
                        // Smoother angles for more natural flow, shorter segments
                        const angle = j === 0 ? 
                            Phaser.Math.FloatBetween(0, Math.PI * 2) : 
                            previousAngle + Phaser.Math.FloatBetween(-Math.PI/3, Math.PI/3);
                        
                        previousAngle = angle;
                        const segmentLength = Phaser.Math.Between(30, 100);
                        
                        x += Math.cos(angle) * segmentLength;
                        y += Math.sin(angle) * segmentLength;
                        
                        // Keep within bounds
                        x = Phaser.Math.Clamp(x, 0, width);
                        y = Phaser.Math.Clamp(y, 0, height);
                        
                        graphics.lineTo(x, y);
                        
                        // Chance to create branches for more complex network - higher chance for realism
                        if (Phaser.Math.Between(0, 100) < 40) { // Increased branch chance
                            const branchAngle = angle + Phaser.Math.FloatBetween(-Math.PI/2, Math.PI/2);
                            const branchLength = segmentLength * Phaser.Math.FloatBetween(0.4, 0.8); // Varied lengths
                            
                            const branchX = x + Math.cos(branchAngle) * branchLength;
                            const branchY = y + Math.sin(branchAngle) * branchLength;
                            
                            // Keep branches in bounds
                            const clampedBranchX = Phaser.Math.Clamp(branchX, 0, width);
                            const clampedBranchY = Phaser.Math.Clamp(branchY, 0, height);
                            
                            // Draw the branch
                            graphics.lineTo(clampedBranchX, clampedBranchY);
                            graphics.moveTo(x, y); // Return to main branch
                            
                            // Occasionally add secondary branches (more complex structure)
                            if (Phaser.Math.Between(0, 100) < 30) {
                                const subBranchAngle = branchAngle + Phaser.Math.FloatBetween(-Math.PI/3, Math.PI/3);
                                const subBranchLength = branchLength * 0.6;
                                
                                const subBranchX = clampedBranchX + Math.cos(subBranchAngle) * subBranchLength;
                                const subBranchY = clampedBranchY + Math.sin(subBranchAngle) * subBranchLength;
                                
                                // Keep branches in bounds
                                const clampedSubBranchX = Phaser.Math.Clamp(subBranchX, 0, width);
                                const clampedSubBranchY = Phaser.Math.Clamp(subBranchY, 0, height);
                                
                                graphics.moveTo(clampedBranchX, clampedBranchY);
                                graphics.lineTo(clampedSubBranchX, clampedSubBranchY);
                                graphics.moveTo(x, y); // Return to main branch
                            }
                        }
                    }
                    
                    graphics.strokePath();
                    
                    // Add more nodes/dots along the path and at endpoints
                    if (Phaser.Math.Between(0, 100) < 70) { // Increased node chance
                        const nodeColor = Phaser.Utils.Array.GetRandom([
                            0x80d080, // Bright green
                            0x90e090, // Very bright green
                            0x70c070, // Medium green
                            0x60b080  // Blue-green
                        ]);
                        
                        // Vary size and alpha for more natural look
                        const nodeSize = Phaser.Math.Between(1, 5);
                        const nodeAlpha = Phaser.Math.FloatBetween(0.15, 0.4);
                        
                        graphics.fillStyle(nodeColor, nodeAlpha);
                        graphics.fillCircle(x, y, nodeSize);
                        
                        // Sometimes add a tiny glow effect
                        if (Phaser.Math.Between(0, 100) < 30) {
                            graphics.fillStyle(nodeColor, nodeAlpha * 0.5);
                            graphics.fillCircle(x, y, nodeSize * 1.8);
                        }
                    }
                }
                
                // Add some subtle ambient dots/small mycelium clusters
                for (let i = 0; i < 40; i++) {
                    const x = Phaser.Math.Between(0, width);
                    const y = Phaser.Math.Between(0, height);
                    const size = Phaser.Math.FloatBetween(0.5, 3);
                    const alpha = Phaser.Math.FloatBetween(0.05, 0.2);
                    
                    // Random color in the green spectrum
                    const color = Phaser.Utils.Array.GetRandom([
                        0x70c070, // Medium green
                        0x90e090, // Bright green
                        0x80c050, // Yellow-green
                        0x60b080  // Blue-green
                    ]);
                    
                    graphics.fillStyle(color, alpha);
                    graphics.fillCircle(x, y, size);
                }
                
                // Generate texture
                graphics.generateTexture(myceliumKey, width, height);
                graphics.destroy();
            }
            
            // Add background with the mycelium texture
            const myceliumBg = this.add.image(400, 300, myceliumKey).setOrigin(0.5);
            myceliumBg.setAlpha(0.9); // Slightly more opaque for better visibility
            
            // Add subtle ambient animations to simulate mycelium growth
            try {
                // Add a few subtle glow points that pulse
                for (let i = 0; i < 5; i++) {
                    const x = Phaser.Math.Between(100, 700);
                    const y = Phaser.Math.Between(150, 450);
                    const size = Phaser.Math.FloatBetween(3, 8);
                    
                    const glow = this.add.circle(x, y, size, 0x88cc88);
                    glow.setAlpha(0.1);
                    
                    // Add subtle pulsing
                    this.tweens.add({
                        targets: glow,
                        alpha: { from: 0.05, to: 0.2 },
                        scale: { from: 0.8, to: 1.2 },
                        duration: Phaser.Math.Between(2000, 5000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            } catch (e) {
                console.error("Could not create ambient effects:", e);
            }
            
        } catch (e) {
            console.error("Error creating enhanced mycelium background:", e);
            
            // Fallback to simple background
            this.add.rectangle(400, 300, 800, 600, 0x0e1d0e);
        }
    }
    
    /**
     * Create ambient floating spores particle effect
     * Enhanced version with more particles and better animations
     */
    createAmbientSpores() {
        try {
            const numSpores = 20; // Number of ambient spores
            this.sporeDecorations = [];
            
            // Create simple circle spores
            for (let i = 0; i < numSpores; i++) {
                // Random position within the game area - avoid UI areas
                const x = Phaser.Math.Between(50, 750);
                const y = Phaser.Math.Between(150, 550);
                
                // Create a small green circle
                const spore = this.add.circle(
                    x, y, 
                    Phaser.Math.Between(2, 4), 
                    0x88ff88, 
                    Phaser.Math.FloatBetween(0.2, 0.4)
                );
                
                // Add simple floating animation
                this.tweens.add({
                    targets: spore,
                    y: y - Phaser.Math.Between(15, 35),
                    alpha: { from: spore.alpha, to: Phaser.Math.FloatBetween(0.1, 0.3) },
                    duration: Phaser.Math.Between(4000, 8000),
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                
                // Add slight horizontal drift for some spores
                if (Phaser.Math.Between(0, 100) < 50) {
                    this.tweens.add({
                        targets: spore,
                        x: x + Phaser.Math.Between(-15, 15),
                        duration: Phaser.Math.Between(5000, 9000),
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                }
                
                this.sporeDecorations.push(spore);
            }
            
        } catch (e) {
            console.error("Error creating ambient spores:", e);
            
            // Ultra-simple fallback
            try {
                for (let i = 0; i < 5; i++) {
                    const x = Phaser.Math.Between(100, 700);
                    const y = Phaser.Math.Between(200, 500);
                    this.add.circle(x, y, 3, 0x88ff88, 0.3);
                }
            } catch (e) {
                console.error("Could not create fallback spores:", e);
            }
        }
    }
    
    /**
     * Create wooden UI frame with mushroom growth - simplified version
     */
    createWoodenUIFrame() {
        try {
            // Create main wooden panel background with improved color and shape
            const woodColor = 0x5a3518; // Richer, more vibrant wood color
            
            // Create simple frame with subtle rounding
            const frameWidth = 800;
            const frameHeight = 100;
            
            // Draw the frame with a simpler design
            // Add shadow for depth
            const frameBgShadow = this.add.rectangle(400, 54, frameWidth, frameHeight + 8, 0x000000, 0.3);
            frameBgShadow.setOrigin(0.5);
            
            // Main wooden board
            const frameBg = this.add.rectangle(400, 50, frameWidth, frameHeight, woodColor);
            frameBg.setOrigin(0.5);
            frameBg.setStrokeStyle(3, 0x442200, 0.7);
            
            // Add simplified wood grain texture
            for (let i = 0; i < 10; i++) {
                const lineY = 50 + Phaser.Math.Between(-frameHeight/2 + 10, frameHeight/2 - 10);
                const lineThickness = Phaser.Math.FloatBetween(0.5, 2.0);
                const lineAlpha = Phaser.Math.FloatBetween(0.1, 0.3);
                
                const grain = this.add.line(
                    0, 0, 
                    400 - frameWidth/2 + 5, lineY, 
                    400 + frameWidth/2 - 5, lineY, 
                    0x331100, lineAlpha
                );
                grain.setLineWidth(lineThickness);
            }
            
            // Create clean, bold title
            const titleText = this.add.text(400, 35, "Spores", {
                fontFamily: 'Arial',
                fontSize: '44px',
                fontWeight: 'bold',
                color: '#eeffee',
                stroke: '#225522',
                strokeThickness: 4,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
            }).setOrigin(0.5, 0.5);
            
            // Add subtle glow effect
            titleText.setBlendMode(Phaser.BlendModes.SCREEN);
            
            // Add simple, subtle decorations instead of mushrooms
            const leftDecor = this.add.circle(280, 35, 6, 0xaaddaa, 0.7);
            const rightDecor = this.add.circle(520, 35, 6, 0xaaddaa, 0.7);
            
            // Add a soft shadow under the frame
            const shadow = this.add.rectangle(400, 106, frameWidth + 20, 18, 0x000000);
            shadow.setAlpha(0.2);
            
            // Make the frame interactive for potential future features
            frameBg.setInteractive();
            
        } catch (e) {
            console.error("Error creating wooden frame:", e);
            // Fallback to simple frame if there's an error
            this.add.rectangle(400, 50, 800, 100, 0x553311);
        }
    }
    
    /**
     * Create a simplified mushroom decoration
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} scale - Size scale
     */
    createSimplifiedMushroomDecoration(x, y, scale = 1) {
        try {
            // Create a simple mushroom silhouette
            // Cap
            const cap = this.add.circle(x, y - 10 * scale, 15 * scale, 0xaaddaa);
            
            // Stem
            const stem = this.add.rectangle(x, y + 7 * scale, 8 * scale, 16 * scale, 0xeeffdd);
            
            // Add a subtle highlight
            const highlight = this.add.arc(
                x - 5 * scale, 
                y - 12 * scale, 
                6 * scale, 
                Math.PI * 0.8, 
                Math.PI * 1.8, 
                false, 
                0xffffff, 
                0.3
            );
            
        } catch (e) {
            console.error("Error creating simplified mushroom decoration:", e);
        }
    }
    

    
    /**
     * Create enhanced mycelium background with more details
     */
    createEnhancedMyceliumBackground() {
        try {
            // Create a simpler but still thematic background
            const graphics = this.add.graphics();
            const width = 800;
            const height = 600;
            
            // Base color - rich dark green
            const baseColor = 0x0e1d0e;
            
            // Draw base
            graphics.fillStyle(baseColor);
            graphics.fillRect(0, 0, width, height);
            
            // Add a subtle gradient overlay
            for (let y = 0; y < height; y += 10) {
                const gradientAlpha = 0.02 + (y / height) * 0.08;
                graphics.fillStyle(0x0a150a, gradientAlpha);
                graphics.fillRect(0, y, width, 10);
            }
            
            // Add a few simple mycelium-like lines
            for (let i = 0; i < 40; i++) {
                const x = Phaser.Math.Between(0, width);
                const y = Phaser.Math.Between(0, height);
                const length = Phaser.Math.Between(30, 100);
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                
                // Random color for the line
                const lineAlpha = Phaser.Math.FloatBetween(0.05, 0.2);
                const lineColor = Phaser.Math.Between(0x60b060, 0x80d080);
                
                graphics.lineStyle(Phaser.Math.FloatBetween(0.5, 2), lineColor, lineAlpha);
                graphics.beginPath();
                graphics.moveTo(x, y);
                graphics.lineTo(
                    x + Math.cos(angle) * length,
                    y + Math.sin(angle) * length
                );
                graphics.strokePath();
            }
            
            // Add some dots for spores
            for (let i = 0; i < 60; i++) {
                const x = Phaser.Math.Between(0, width);
                const y = Phaser.Math.Between(0, height);
                const size = Phaser.Math.FloatBetween(0.5, 3);
                const alpha = Phaser.Math.FloatBetween(0.05, 0.2);
                
                graphics.fillStyle(0x88cc88, alpha);
                graphics.fillCircle(x, y, size);
            }
            
            // Add a few subtle glow points
            for (let i = 0; i < 10; i++) {
                const x = Phaser.Math.Between(50, 750);
                const y = Phaser.Math.Between(150, 550);
                const size = Phaser.Math.FloatBetween(2, 5);
                
                const glow = this.add.circle(x, y, size, 0x88ff88);
                glow.setAlpha(0.1);
                
                // Add subtle pulsing
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 0.05, to: 0.2 },
                    scale: { from: 0.8, to: 1.2 },
                    duration: Phaser.Math.Between(2000, 5000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
        } catch (e) {
            console.error("Error creating enhanced mycelium background:", e);
            // Simple fallback
            this.add.rectangle(400, 300, 800, 600, 0x0e1d0e);
        }
    }
    
    /**
     * Reset the game for a new level or restart
     * @param {number} gridSize - Size of the grid (6 for tutorial, 8 for normal)
     */
    resetGame(gridSize = 8) {
        console.log(`Starting game reset to gridSize ${gridSize}`);
        
        // Reset score
        this.score = 0;
        this.scoreText.setText(`Score: 0`);
        
        // Reset statistics
        this.stats = {
            wordsFormed: 0,
            cascadesCreated: 0
        };
        
        // Important: Remove all event listeners before recreating the grid
        this.events.removeListener('wordSelected');
        this.events.removeListener('invalidWord');
        this.events.removeListener('tilesExploded');
        
        // Calculate grid dimensions
        const gameDimension = Math.min(this.cameras.main.width, this.cameras.main.height) * 0.8;
        const gridX = (this.cameras.main.width - gameDimension) / 2;
        const gridY = 100;
        
        // Store reference to old grid
        const oldGrid = this.grid;
        
        // Create new grid first before destroying the old one
        try {
            console.log("Creating new grid");
            this.grid = new Grid(this, gridX, gridY, gameDimension, gameDimension, gridSize);

            // Refresh hint words for the new grid
            this.updateHintWords();
            
            // Reset word text
            this.wordText.setText('');
            
            // Re-add event listeners for the new grid
            this.events.on('wordSelected', this.onWordSelected, this);
            this.events.on('invalidWord', this.onInvalidWord, this);
            this.events.on('tilesExploded', this.onTilesExploded, this);
            
            // Now safely destroy the old grid if it exists
            if (oldGrid) {
                console.log("Destroying old grid");
                try {
                    // Manually destroy all tiles first
                    for (let row = 0; row < oldGrid.gridSize; row++) {
                        for (let col = 0; col < oldGrid.gridSize; col++) {
                            if (oldGrid.tiles && oldGrid.tiles[row] && oldGrid.tiles[row][col]) {
                                oldGrid.tiles[row][col].destroy();
                                oldGrid.tiles[row][col] = null;
                            }
                        }
                    }
                    
                    // Clear any tweens that might be associated with the old grid
                    this.tweens.killAll();
                } catch (e) {
                    console.error("Error during old grid cleanup:", e);
                }
            }
            
            // Show tooltips for tutorial level after a delay
            if (this.levelManager.currentLevel === 1) {
                this.time.delayedCall(500, () => {
                    this.levelManager.showTooltips();
                });
            }
            
            console.log(`Game reset complete for level ${this.levelManager.currentLevel} with grid size ${gridSize}x${gridSize}`);
        } catch (error) {
            console.error("Critical error during game reset:", error);
        }
    }

    /**
     * Create the hint UI container on the DOM
     */
    createHintUI() {
        this.hintContainer = document.createElement('div');
        this.hintContainer.className = 'word-hints-container';

        const title = document.createElement('div');
        title.className = 'hint-title';
        title.textContent = 'Hints';
        this.hintContainer.appendChild(title);

        this.hintList = document.createElement('ul');
        this.hintContainer.appendChild(this.hintList);

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.hintContainer);
        } else {
            document.body.appendChild(this.hintContainer);
        }
    }

    /**
     * Update the list of hint words based on the current grid
     */
    updateHintWords() {
        if (!this.grid || !this.grid.getValidWords) return;
        const words = this.grid.getValidWords(20);
        this.currentHints = words.slice(0, 4);

        if (this.hintList) {
            this.hintList.innerHTML = '';
            this.currentHints.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                this.hintList.appendChild(li);
            });
        }
    }

    /**
     * Remove a word from the hint list with a fade animation
     * @param {string} word - Word to remove
     */
    removeHintWord(word) {
        if (!this.hintList) return;
        const items = Array.from(this.hintList.children);
        for (const li of items) {
            if (li.textContent === word.toUpperCase()) {
                li.classList.add('fade-out');
                setTimeout(() => {
                    li.remove();
                    this.updateHintWords();
                }, 300);
                break;
            }
        }
    }

    /**
     * Check if a selected word matches a hint and remove it
     * @param {string} word - The word found by the player
     */
    checkHintWord(word) {
        if (this.currentHints && this.currentHints.includes(word.toUpperCase())) {
            this.removeHintWord(word);
        }
    }
}