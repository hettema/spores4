/**
 * Main entry point for the Spores game
 */
window.onload = function() {
    // Game configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#0a1a0a',
        scene: [GameScene],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        }
    };
    
    // Create game instance
    const game = new Phaser.Game(config);
    
    // Check if we need to initialize at a specific level
    game.events.once('ready', () => {
        const storedLevel = sessionStorage.getItem('sporesLevel');
        if (storedLevel) {
            const levelNumber = parseInt(storedLevel, 10);
            
            // Clear the stored level so it doesn't persist indefinitely
            sessionStorage.removeItem('sporesLevel');
            
            // Give the scene a moment to initialize before setting the level
            setTimeout(() => {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene && gameScene.levelManager) {
                    // Initialize at the correct level
                    gameScene.levelManager.initLevel(levelNumber);
                    
                    // Reset the game for this level
                    gameScene.score = 0;
                    gameScene.scoreText.setText(`Score: 0`);
                    
                    // Reset grid if level 2
                    if (levelNumber === 2) {
                        try {
                            // Recreate grid with 8x8 size
                            const gridSize = Math.min(gameScene.cameras.main.width, gameScene.cameras.main.height) * 0.8;
                            const gridX = (gameScene.cameras.main.width - gridSize) / 2;
                            const gridY = 100;
                            
                            // Clean up existing grid first
                            if (gameScene.grid && typeof gameScene.grid.cleanup === 'function') {
                                gameScene.grid.cleanup();
                            }
                            
                            // Create a new grid with 8x8 size
                            gameScene.grid = new Grid(gameScene, gridX, gridY, gridSize, gridSize, 8);
                            
                            // Rebuild UI for level 2
                            gameScene.levelManager.createUI();
                        } catch (e) {
                            console.error('Error setting up level 2:', e);
                        }
                    }
                }
            }, 500);
        }
    });
    
    // Handle responsive scaling
    window.addEventListener('resize', function() {
        game.scale.refresh();
    });
    
    // Store game instance globally (for debugging)
    window.game = game;
};
