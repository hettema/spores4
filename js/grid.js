/**
 * Manages the grid of letter tiles
 */
class Grid {
    /**
     * Create a new grid
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} x - X position of grid top-left
     * @param {number} y - Y position of grid top-left
     * @param {number} width - Width of the grid
     * @param {number} height - Height of the grid
     * @param {number} gridSize - Size of the grid (6 for tutorial, 8 for normal)
     */
    constructor(scene, x, y, width, height, gridSize = 8) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.gridSize = gridSize; // Default to 8x8 grid
        this.tileSize = Math.min(width, height) / this.gridSize;
        
        // Game parameters (can be modified by settings)
        this.gameParameters = {
            sporeCount: 4,           // Base number of spores released per explosion
            sporeThreshold: 5,       // Number of spores needed to trigger an explosion
            sporeDistribution: 2,    // Controls how widely spores are distributed
            wordLengthFactor: 1.5    // Multiplier for word length bonus (6+ letters)
        };
        
        // Create array to hold tile objects
        this.tiles = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        
        // Fill the grid with tiles
        this.fillGrid();
        
        // Track selected tiles for word formation
        this.selectedTiles = [];
        this.isSelecting = false;
        
        // Add input handling
        this.setupInput();
        
        console.log(`Created grid with size ${gridSize}x${gridSize}`);
    }
    
    /**
     * Fill the grid with letter tiles
     */
    fillGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.createTile(row, col);
                
                // Apply a fade-in effect for initial grid display to avoid artifacts
                tile.container.forEach(element => {
                    if (element) {
                        element.setAlpha(0);
                    }
                });
                
                // Stagger the fade-in for a nicer visual effect
                this.scene.tweens.add({
                    targets: tile.container,
                    alpha: 1,
                    duration: 150,
                    ease: 'Linear',
                    delay: (row * 8) + (col * 8) // Staggered delay
                });
            }
        }
    }
    
    /**
     * Create a new tile at the specified grid position
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Tile} The created tile
     */
    createTile(row, col) {
        // Calculate pixel position
        const x = this.x + (col + 0.5) * this.tileSize;
        const y = this.y + (row + 0.5) * this.tileSize;
        
        // Generate random letter
        const letter = LetterData.getRandomLetter();
        
        // Create tile with the current spore threshold from gameParameters
        const tile = new Tile(this.scene, x, y, col, row, letter, this.tileSize * 0.9);
        
        // Set the spore threshold based on current game parameters
        tile.sporeThreshold = this.gameParameters.sporeThreshold;
        
        // Store in grid
        this.tiles[row][col] = tile;
        
        return tile;
    }
    
    /**
     * Set up input handling for the grid
     */
    setupInput() {
        // Store references to the handlers so we can remove them later
        this.pointerDownHandler = (pointer) => {
            // Safety check to make sure the grid still exists
            if (!this.scene || !this.tiles) return;
            
            // Check if pointer is within grid bounds
            if (this.isPointInGrid(pointer.x, pointer.y)) {
                // Reset selection
                this.clearSelection();
                
                // Start new selection
                this.isSelecting = true;
                
                // Try to select the tile under pointer
                const gridPos = this.pixelToGrid(pointer.x, pointer.y);
                if (gridPos) {
                    const tile = this.tiles[gridPos.row][gridPos.col];
                    if (tile) {
                        this.selectTile(tile);
                    }
                }
            }
        };
        
        this.pointerMoveHandler = (pointer) => {
            // Safety check to make sure the grid still exists
            if (!this.scene || !this.tiles || !this.isSelecting) return;
            
            // Try to select the tile under pointer
            const gridPos = this.pixelToGrid(pointer.x, pointer.y);
            if (gridPos && gridPos.row >= 0 && gridPos.row < this.gridSize && 
                gridPos.col >= 0 && gridPos.col < this.gridSize) {
                
                const tile = this.tiles[gridPos.row][gridPos.col];
                
                // Safety check for the tile
                if (!tile) return;
                
                // Check if the tile is adjacent to the last selected tile
                if (this.selectedTiles.length === 0 || 
                    (this.selectedTiles[this.selectedTiles.length - 1] && 
                     this.isAdjacent(this.selectedTiles[this.selectedTiles.length - 1], tile))) {
                    
                    // Check if tile is already selected
                    const index = this.selectedTiles.indexOf(tile);
                    
                    if (index === -1) {
                        // Not selected yet, add it
                        this.selectTile(tile);
                    } else if (index === this.selectedTiles.length - 2) {
                        // Going back one step - check if we have enough tiles first
                        if (this.selectedTiles.length > 1) {
                            this.unselectTile(this.selectedTiles[this.selectedTiles.length - 1]);
                        }
                    }
                }
            }
        };
        
        this.pointerUpHandler = () => {
            // Safety check to make sure the grid still exists
            if (!this.scene || !this.isSelecting) return;
            
            this.isSelecting = false;
            
            // Process the selected word
            if (this.selectedTiles.length >= 3) {
                // For now, always consider the word valid (as per PRD)
                this.processWord();
            } else {
                // Not enough letters, clear selection
                this.clearSelection();
            }
        };
        
        // Add input handlers
        this.scene.input.on('pointerdown', this.pointerDownHandler);
        this.scene.input.on('pointermove', this.pointerMoveHandler);
        this.scene.input.on('pointerup', this.pointerUpHandler);
    }
    
    /**
     * Check if a point is within the grid
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is in grid
     */
    isPointInGrid(x, y) {
        return (
            x >= this.x &&
            x < this.x + this.width &&
            y >= this.y &&
            y < this.y + this.height
        );
    }
    
    /**
     * Convert pixel coordinates to grid position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} {row, col} or null if out of bounds
     */
    pixelToGrid(x, y) {
        if (!this.isPointInGrid(x, y)) {
            return null;
        }
        
        const col = Math.floor((x - this.x) / this.tileSize);
        const row = Math.floor((y - this.y) / this.tileSize);
        
        // Make sure it's in bounds
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            return { row, col };
        }
        
        return null;
    }
    
    /**
     * Check if two tiles are adjacent (including diagonally)
     * @param {Tile} tile1 - First tile
     * @param {Tile} tile2 - Second tile
     * @returns {boolean} True if tiles are adjacent
     */
    isAdjacent(tile1, tile2) {
        const rowDiff = Math.abs(tile1.gridY - tile2.gridY);
        const colDiff = Math.abs(tile1.gridX - tile2.gridX);
        
        // Adjacent if not the same tile and both row/col diff <= 1
        return (tile1 !== tile2) && (rowDiff <= 1 && colDiff <= 1);
    }
    
    /**
     * Select a tile
     * @param {Tile} tile - The tile to select
     */
    selectTile(tile) {
        // Safety checks
        if (!tile || !this.selectedTiles) return;
        
        // Only add if not already selected
        if (!this.selectedTiles.includes(tile)) {
            this.selectedTiles.push(tile);
            
            // Make sure the tile's setSelected method exists
            if (typeof tile.setSelected === 'function') {
                tile.setSelected(true);
            }
        }
    }
    
    /**
     * Unselect a tile
     * @param {Tile} tile - The tile to unselect
     */
    unselectTile(tile) {
        // Safety checks
        if (!tile || !this.selectedTiles) return;
        
        const index = this.selectedTiles.indexOf(tile);
        if (index !== -1) {
            // Remove from array first
            this.selectedTiles.splice(index);
            
            // Then update the tile's visual state if the method exists
            if (typeof tile.setSelected === 'function') {
                tile.setSelected(false);
            }
        }
    }
    
    /**
     * Clear all selected tiles
     */
    clearSelection() {
        // Safety check
        if (!this.selectedTiles) {
            this.selectedTiles = [];
            return;
        }
        
        // Make a copy of the array to avoid issues during iteration
        const tilesToClear = [...this.selectedTiles];
        
        // Clear the array first
        this.selectedTiles = [];
        
        // Then update each tile's visual state
        tilesToClear.forEach(tile => {
            if (tile && typeof tile.setSelected === 'function') {
                try {
                    tile.setSelected(false);
                } catch (e) {
                    console.error("Error clearing tile selection:", e);
                }
            }
        });
    }
    
    /**
     * Process the selected word
     */
    processWord() {
        // Get the word as a string
        const word = this.selectedTiles.map(tile => tile.letter).join('');
        console.log(`Processing word: ${word}`);
        
        // Check if the word is valid using the scene's validator
        const isValid = this.scene.wordValidator.isValid(word);
        
        if (!isValid) {
            // Word is invalid, show feedback and clear selection
            console.log(`Word "${word}" is invalid`);
            this.scene.events.emit('invalidWord', word);
            
            // Shake selected tiles to provide visual feedback
            this.shakeInvalidWord();
            
            return 0;
        }
        
        // Word is valid, proceed
        console.log(`Word "${word}" is valid`);
        
        // Calculate word score
        const wordScore = this.calculateWordScore();
        
        // Emit event with word and score
        this.scene.events.emit('wordSelected', word, wordScore);
        
        // Explode tiles
        const explosionResult = this.explodeTiles(this.selectedTiles);
        
        // Emit event with explosion stats (will be used when processExplosions completes)
        this.scene.time.delayedCall(300, () => {
            this.scene.events.emit('tilesExploded', explosionResult.tilesExploded, explosionResult.cascadeCount);
        });
        
        // Clear selection
        this.clearSelection();
        
        // Return the score
        return wordScore;
    }
    
    /**
     * Shake the selected tiles to provide feedback for invalid words
     */
    shakeInvalidWord() {
        // Shake animation for each selected tile
        this.selectedTiles.forEach(tile => {
            // Initial position
            const originalX = tile.background.x;
            
            // Shake animation
            this.scene.tweens.add({
                targets: tile.container,
                x: { from: originalX - 5, to: originalX + 5 },
                duration: 50,
                repeat: 3,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    // Reset position
                    tile.container.forEach(item => {
                        item.x = originalX;
                    });
                    
                    // Clear selection after shaking
                    this.clearSelection();
                }
            });
        });
    }
    
    /**
     * Calculate the score for the selected word
     * @returns {number} The word score
     */
    calculateWordScore() {
        // Basic score: sum of letter values
        let score = 0;
        this.selectedTiles.forEach(tile => {
            score += LetterData.getPointValue(tile.letter);
        });
        
        // Word length bonus (6+ letters) - use the configurable factor
        if (this.selectedTiles.length >= 6) {
            score *= this.gameParameters.wordLengthFactor;
        }
        
        return Math.floor(score);
    }
    
    /**
     * Explode tiles and trigger spore release
     * @param {Tile[]} tiles - Array of tiles to explode
     */
    explodeTiles(tiles) {
        console.log(`Exploding ${tiles.length} tiles`);
        
        // Save a copy of tiles for processing
        const tilesToExplode = [...tiles];
        
        // Keep track of cascades and total tiles exploded
        let cascadeCount = 0;
        let tilesExploded = new Set();
        
        // Set cascade limit to prevent infinite chains
        const maxCascades = 8;
        
        // Process tile explosions recursively
        const processExplosions = () => {
            if (tilesToExplode.length === 0 || cascadeCount >= maxCascades) {
                // All explosions processed or cascade limit reached
                console.log(`Explosion chain complete: ${tilesExploded.size} tiles exploded, ${cascadeCount} cascades`);
                this.refillGrid();
                return;
            }
            
            const currentTile = tilesToExplode.shift();
            
            // Safety check - make sure the tile exists and isn't already exploded
            if (!currentTile || tilesExploded.has(currentTile)) {
                processExplosions(); // Skip and continue to next
                return;
            }
            
            tilesExploded.add(currentTile);
            
            // Store tile position
            const gridX = currentTile.gridX;
            const gridY = currentTile.gridY;
            
            console.log(`Exploding tile at [${gridY}][${gridX}] (letter: ${currentTile.letter})`);
            
            // Safety check - verify the tile is where we think it is
            if (this.tiles[gridY][gridX] !== currentTile) {
                console.error(`Tile mismatch at [${gridY}][${gridX}]!`);
                // Find and fix the tile's actual position
                let found = false;
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        if (this.tiles[row][col] === currentTile) {
                            console.log(`Found tile at actual position [${row}][${col}]`);
                            // Update the tile's grid position
                            currentTile.gridX = col;
                            currentTile.gridY = row;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                
                if (!found) {
                    console.error(`Could not find tile in grid!`);
                    processExplosions(); // Skip this tile
                    return;
                }
            }
            
            // Animate explosion
            currentTile.animateExplosion(() => {
                // Double-check the tile is still where we think it is before removing
                if (this.tiles[gridY][gridX] === currentTile) {
                    // Remove the tile from the grid
                    this.tiles[gridY][gridX] = null;
                    console.log(`Removed tile from grid at [${gridY}][${gridX}]`);
                } else {
                    // Try to find and remove it from its actual position
                    let found = false;
                    for (let row = 0; row < this.gridSize; row++) {
                        for (let col = 0; col < this.gridSize; col++) {
                            if (this.tiles[row][col] === currentTile) {
                                console.log(`Removing tile from actual position [${row}][${col}]`);
                                this.tiles[row][col] = null;
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                    
                    if (!found) {
                        console.error(`Could not find tile to remove!`);
                    }
                }
                
                // Calculate number of spores to release - using the gameParameters value
                const sporeCount = Math.min(this.gameParameters.sporeCount, Math.ceil(tiles.length / 1.5));
                
                // New adjacency-based spore distribution algorithm
                const newCascades = this.spreadSporesWithAdjacency(gridX, gridY, sporeCount, tilesToExplode, tilesExploded);
                
                // Update cascade count
                if (newCascades) {
                    cascadeCount += newCascades;
                }
                
                // Process next explosion with a slight delay for visual effect
                this.scene.time.delayedCall(80, processExplosions);
            });
        };
        
        // Start with processing explosions
        if (tilesToExplode.length > 0) {
            processExplosions();
        } else {
            // No tiles to explode
            console.log("No tiles to explode!");
            this.refillGrid();
        }
        
        return {
            tilesExploded: tilesExploded.size,
            cascadeCount: cascadeCount
        };
    }
    
    /**
     * Distribute spores using adjacency-based algorithm
     * @param {number} originX - X position of the exploded tile
     * @param {number} originY - Y position of the exploded tile
     * @param {number} sporeCount - Number of spores to distribute
     * @param {Array} tilesToExplode - Array of tiles waiting to explode
     * @param {Set} tilesExploded - Set of tiles that have already exploded
     */
    spreadSporesWithAdjacency(originX, originY, sporeCount, tilesToExplode, tilesExploded) {
        // Collect potential target tiles with weights
        const targetTiles = [];
        let cascadeCount = 0;
        
        // Get the distribution range from game parameters (1-5)
        const distributionRange = this.gameParameters.sporeDistribution;
        
        // Check an area around the exploded tile based on the distribution range
        const searchRadius = Math.max(1, Math.min(Math.floor(distributionRange * 1.5), 5));
        
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                // Skip the original tile position
                if (dx === 0 && dy === 0) continue;
                
                const newX = originX + dx;
                const newY = originY + dy;
                
                // Ensure we're within grid bounds
                if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                    const targetTile = this.tiles[newY][newX];
                    
                    // Skip empty spaces and tiles in explosion queue
                    if (!targetTile || tilesToExplode.includes(targetTile) || tilesExploded.has(targetTile)) continue;
                    
                    // Calculate proximity weight - closer tiles get higher weight
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    // Weight is affected by distribution range - higher distribution = more uniform spread
                    // Lower distribution = more concentrated around explosion
                    let weight = (6 - distance) / distributionRange;
                    
                    // Give bonus weight to tiles that already have spores
                    // This creates "hot spots" and chain reactions
                    if (targetTile.sporeCount > 0) {
                        // Bonus increases as tile gets closer to exploding
                        const progressToExplode = targetTile.sporeCount / targetTile.sporeThreshold;
                        weight *= (1 + progressToExplode * 2);
                    }
                    
                    // Add to candidates with calculated weight
                    targetTiles.push({
                        tile: targetTile,
                        weight: weight,
                        x: newX,
                        y: newY
                    });
                }
            }
        }
        
        // If no valid targets, don't distribute any spores
        if (targetTiles.length === 0) {
            console.log("No valid targets for spore distribution");
            return;
        }
        
        // Calculate total weight for normalization
        const totalWeight = targetTiles.reduce((sum, t) => sum + t.weight, 0);
        
        // Distribute spores based on calculated probabilities
        for (let i = 0; i < sporeCount; i++) {
            // Select a tile based on weighted probability
            let randomValue = Math.random() * totalWeight;
            let cumulativeWeight = 0;
            let selectedTile = null;
            
            for (const target of targetTiles) {
                cumulativeWeight += target.weight;
                if (randomValue <= cumulativeWeight) {
                    selectedTile = target.tile;
                    break;
                }
            }
            
            // If no tile was selected, pick one randomly
            if (!selectedTile && targetTiles.length > 0) {
                const randomIndex = Math.floor(Math.random() * targetTiles.length);
                selectedTile = targetTiles[randomIndex].tile;
            }
            
            // Add spore to the selected tile
            if (selectedTile) {
                console.log(`Adding spore to tile at [${selectedTile.gridY}][${selectedTile.gridX}] with letter ${selectedTile.letter}`);
                const exploded = selectedTile.addSpores(1);
                
                // If tile reached threshold, queue it for explosion
                if (exploded && !tilesToExplode.includes(selectedTile)) {
                    tilesToExplode.push(selectedTile);
                    
                    // Count as cascade (not in the original word)
                    if (!tilesExploded.has(selectedTile)) {
                        cascadeCount++;
                    }
                }
            }
        }
        
        return cascadeCount;
    }
    
    /**
     * Refill the grid after tiles explode
     */
    refillGrid() {
        console.log("Starting grid refill");
        
        // First, check if there are any null cells in the grid
        let hasNullCells = false;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.tiles[row][col] === null) {
                    hasNullCells = true;
                    console.log(`Found null cell at [${row}][${col}]`);
                }
            }
        }
        
        if (!hasNullCells) {
            console.log("No null cells found, skipping refill");
            return;
        }
        
        // Process from bottom to top, column by column
        for (let col = 0; col < this.gridSize; col++) {
            // Find and fill gaps
            this.refillColumn(col);
        }
        
        // Double-check that all cells are filled
        let stillHasNullCells = false;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.tiles[row][col] === null) {
                    stillHasNullCells = true;
                    console.log(`Still have null cell at [${row}][${col}] after refill! Creating new tile.`);
                    
                    // Force create a new tile at this position
                    const x = this.x + (col + 0.5) * this.tileSize;
                    const finalY = this.y + (row + 0.5) * this.tileSize;
                    const startY = this.y - this.tileSize; // Start above the grid
                    const letter = LetterData.getRandomLetter();
                    
                    // Create the tile directly at its final position but with alpha 0
                    const tile = new Tile(this.scene, x, finalY, col, row, letter, this.tileSize * 0.9);
                    
                    // Apply the current spore threshold
                    tile.sporeThreshold = this.gameParameters.sporeThreshold;
                    
                    this.tiles[row][col] = tile;
                    
                    // Set initial position and make it invisible to prevent artifacts
                    tile.container.forEach(element => {
                        if (element) {
                            element.y = startY; // Position above the grid
                            element.setAlpha(0); // Start invisible
                        }
                    });
                    
                    // Animate falling into place with fade-in
                    this.scene.tweens.add({
                        targets: tile.container,
                        y: finalY,
                        alpha: 1,
                        duration: 200,
                        ease: 'Bounce.easeOut'
                    });
                }
            }
        }
        
        // Allow input after tiles have settled (with a delay)
        this.scene.time.delayedCall(300, () => {
            this.isSelecting = false;
            
            // Final verification
            let anyNulls = false;
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.tiles[row][col] === null) {
                        anyNulls = true;
                        console.error(`CRITICAL: Still have null at [${row}][${col}] after all refill operations!`);
                    }
                }
            }
            
            if (anyNulls) {
                // Emergency reset if there are still nulls
                console.log("Emergency grid reset triggered");
                this.resetGrid();
            }
        });
    }
    
    /**
     * Emergency reset of the entire grid if refill fails
     */
    resetGrid() {
        // Clear all existing tiles
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.tiles[row][col] !== null) {
                    this.tiles[row][col].destroy();
                }
                this.tiles[row][col] = null;
            }
        }
        
        // Refill the entire grid with new tiles
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Create a new tile
                const x = this.x + (col + 0.5) * this.tileSize;
                const y = this.y + (row + 0.5) * this.tileSize;
                const letter = LetterData.getRandomLetter();
                
                // Create new tile with proper initial opacity to prevent artifacts
                const tile = new Tile(this.scene, x, y, col, row, letter, this.tileSize * 0.9);
                
                // Apply the current spore threshold
                tile.sporeThreshold = this.gameParameters.sporeThreshold;
                
                this.tiles[row][col] = tile;
                
                // Add a subtle fade-in effect to make the appearance smoother
                tile.container.forEach(element => {
                    if (element) {
                        element.setAlpha(0);
                    }
                });
                
                // Fade in the tile
                this.scene.tweens.add({
                    targets: tile.container,
                    alpha: 1,
                    duration: 150,
                    ease: 'Linear'
                });
            }
        }
    }
    
    /**
     * Refill a single column
     * @param {number} col - The column to refill
     */
    refillColumn(col) {
        // Find empty spots (null tiles)
        let emptyRows = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            if (this.tiles[row][col] === null) {
                emptyRows.push(row);
            }
        }
        
        // If no empty spots, nothing to do
        if (emptyRows.length === 0) {
            return;
        }
        
        console.log(`Refilling column ${col} with ${emptyRows.length} empty spots at rows: ${emptyRows.join(', ')}`);
        
        // First, compact all non-null tiles downward
        for (let destRow = this.gridSize - 1; destRow >= 0; destRow--) {
            // If this cell is empty, find a non-empty cell above it to move down
            if (this.tiles[destRow][col] === null) {
                let sourceRow = -1;
                
                // Find the nearest non-null tile above this position
                for (let srcRow = destRow - 1; srcRow >= 0; srcRow--) {
                    if (this.tiles[srcRow][col] !== null) {
                        sourceRow = srcRow;
                        break;
                    }
                }
                
                if (sourceRow >= 0) {
                    console.log(`Moving tile from [${sourceRow}][${col}] to [${destRow}][${col}]`);
                    
                    // Move the tile down
                    this.tiles[destRow][col] = this.tiles[sourceRow][col];
                    this.tiles[sourceRow][col] = null;
                    
                    // Update grid position
                    this.tiles[destRow][col].gridY = destRow;
                    
                    // Animate movement
                    const newY = this.y + (destRow + 0.5) * this.tileSize;
                    this.scene.tweens.add({
                        targets: this.tiles[destRow][col].container,
                        y: newY,
                        duration: 150,
                        ease: 'Cubic.easeIn'
                    });
                }
            }
        }
        
        // Now, count how many empty spots remain at the top of the column
        let emptyCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            if (this.tiles[row][col] === null) {
                emptyCount++;
            } else {
                break; // Stop counting when we hit a non-null tile
            }
        }
        
        console.log(`Column ${col} has ${emptyCount} empty spots at the top after compacting`);
        
        // Fill in empty spots at the top with new tiles
        for (let row = 0; row < emptyCount; row++) {
            if (this.tiles[row][col] !== null) {
                console.error(`Unexpected non-null tile at [${row}][${col}] when creating new tiles!`);
                continue;
            }
            
            console.log(`Creating new tile at [${row}][${col}]`);
            
            // Create a new tile just above the grid
            const x = this.x + (col + 0.5) * this.tileSize;
            const y = this.y - this.tileSize * (emptyCount - row);
            const letter = LetterData.getRandomLetter();
            
            // Create the tile at the final position but make it invisible initially
            const newY = this.y + (row + 0.5) * this.tileSize;
            const tile = new Tile(this.scene, x, newY, col, row, letter, this.tileSize * 0.9);
            
            // Apply the current spore threshold
            tile.sporeThreshold = this.gameParameters.sporeThreshold;
            
            this.tiles[row][col] = tile;
            
            // Initially set the position off-screen
            tile.container.forEach(element => {
                if (element) {
                    element.y = y;
                    // Initially hide the tile to prevent artifacts
                    element.setAlpha(0);
                }
            });
            
            // Animate falling into place with fade-in
            this.scene.tweens.add({
                targets: tile.container,
                y: newY,
                alpha: 1, // Fade in as it falls
                duration: 200,
                ease: 'Bounce.easeOut',
                delay: row * 30 // Stagger the fall for a cascading effect
            });
        }
        
        // Verify that all spots in this column are now filled
        for (let row = 0; row < this.gridSize; row++) {
            if (this.tiles[row][col] === null) {
                console.error(`Critical error: Column ${col}, row ${row} is still null after refill!`);
            }
        }
    }
    
    /**
     * Update game parameters based on settings
     * @param {Object} settings - New settings object
     */
    updateGameParameters(settings) {
        // Update our parameters
        if (settings) {
            this.gameParameters = {
                ...this.gameParameters,
                ...settings
            };
            
            console.log("Game parameters updated:", this.gameParameters);
            
            // Update tile spore thresholds
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const tile = this.tiles[row][col];
                    if (tile) {
                        tile.sporeThreshold = this.gameParameters.sporeThreshold;
                        tile.updateAppearance(); // Refresh appearance based on new threshold
                    }
                }
            }
        }
    }
    
    /**
     * Cleanup for grid reset
     */
    cleanup() {
        try {
            console.log("Starting grid cleanup");
            
            // Remove input event listeners first to prevent any interaction during cleanup
            if (this.scene && this.scene.input) {
                console.log("Removing input event listeners");
                if (this.pointerDownHandler) this.scene.input.off('pointerdown', this.pointerDownHandler);
                if (this.pointerMoveHandler) this.scene.input.off('pointermove', this.pointerMoveHandler);
                if (this.pointerUpHandler) this.scene.input.off('pointerup', this.pointerUpHandler);
            }
            
            // Clear selection first - make a safe copy of the array
            if (this.selectedTiles && this.selectedTiles.length > 0) {
                console.log(`Clearing ${this.selectedTiles.length} selected tiles`);
                
                // Make a safe copy to avoid mutation during iteration
                const tilesToClear = [...this.selectedTiles];
                
                // Clear the selection array first to prevent callbacks from accessing it
                this.selectedTiles = [];
                
                // Now safely unselect each tile
                tilesToClear.forEach(tile => {
                    if (tile && typeof tile.setSelected === 'function') {
                        try {
                            tile.setSelected(false);
                        } catch (e) {
                            console.error("Error unselecting tile:", e);
                        }
                    }
                });
            }
            
            // Kill all tweens associated with this grid
            if (this.scene && this.scene.tweens) {
                console.log("Killing all tweens");
                this.scene.tweens.killAll();
            }
            
            // Destroy all tile objects
            if (this.tiles) {
                console.log("Destroying all tiles");
                
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        if (this.tiles[row] && this.tiles[row][col]) {
                            try {
                                this.tiles[row][col].destroy();
                            } catch (e) {
                                console.error(`Error destroying tile at [${row}][${col}]:`, e);
                            }
                            if (this.tiles[row]) {
                                this.tiles[row][col] = null;
                            }
                        }
                    }
                }
                
                // Clear the tiles array completely
                this.tiles = null;
            }
            
            // Clear references
            this.isSelecting = false;
            
            console.log("Grid cleanup complete");
        } catch (error) {
            console.error("Error during grid cleanup:", error);
        }
    }
}
