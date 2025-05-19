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
            sporeCount: 8,           // Base number of spores released per explosion
            sporeThreshold: 2,       // Number of spores needed to trigger an explosion
            sporeDistribution: 1.5,  // Controls how widely spores are distributed
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
        // First, populate the grid normally
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
        
        // Check if we should ensure 4-letter words (only for level 2 and above)
        if (this.gridSize >= 8 && this.scene.levelManager && this.scene.levelManager.currentLevel >= 2) {
            // Attempt to validate the grid has at least 4 valid 4-letter words
            this.ensureFourLetterWords();
        }
    }
    
    /**
     * Ensure the grid has at least 4 valid 4-letter words
     */
    ensureFourLetterWords() {
        // Maximum attempts to regenerate the grid
        const maxAttempts = 5;
        let attempts = 0;
        let foundWords = 0;
        
        // Keep track of possible words to avoid duplicates
        const foundWordsList = new Set();
        
        while (attempts < maxAttempts && foundWords < 4) {
            console.log(`Checking for 4-letter words, attempt ${attempts + 1}`);
            foundWords = 0;
            foundWordsList.clear();
            
            // Dictionary to use for validation
            let dictionary = null;
            
            // Try to use the game's dictionary if available
            if (this.scene.wordValidator && this.scene.wordValidator.dictionary) {
                dictionary = this.scene.wordValidator.dictionary;
            }
            
            // Check every possible sequence of 4 adjacent tiles
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    // Skip if we already found enough words
                    if (foundWords >= 4) break;
                    
                    // Starting position
                    const startTile = this.tiles[row][col];
                    if (!startTile) continue;
                    
                    // Check all 8 directions from this tile
                    const directions = [
                        { dr: -1, dc: 0 },  // Up
                        { dr: -1, dc: 1 },  // Up-Right
                        { dr: 0, dc: 1 },   // Right
                        { dr: 1, dc: 1 },   // Down-Right
                        { dr: 1, dc: 0 },   // Down
                        { dr: 1, dc: -1 },  // Down-Left
                        { dr: 0, dc: -1 },  // Left
                        { dr: -1, dc: -1 }  // Up-Left
                    ];
                    
                    // Try each direction
                    for (const dir of directions) {
                        // Check if we can form a 4-letter word in this direction
                        if (row + dir.dr * 3 >= 0 && row + dir.dr * 3 < this.gridSize &&
                            col + dir.dc * 3 >= 0 && col + dir.dc * 3 < this.gridSize) {
                            
                            // Collect the 4 tiles in this direction
                            const wordTiles = [];
                            for (let i = 0; i < 4; i++) {
                                const r = row + dir.dr * i;
                                const c = col + dir.dc * i;
                                const tile = this.tiles[r][c];
                                wordTiles.push(tile);
                            }
                            
                            // Form the word
                            const word = wordTiles.map(tile => tile.letter).join('');
                            
                            // Don't count the same word twice
                            if (foundWordsList.has(word)) {
                                continue;
                            }
                            
                            // Check if this is a valid word
                            let isValid = false;
                            
                            // If we have a dictionary, use it
                            if (dictionary) {
                                isValid = dictionary.has(word.toUpperCase());
                            } else {
                                // Without a dictionary, use a fallback list of common 4-letter words
                                const commonFourLetterWords = [
                                    'ABLE', 'ACID', 'AGED', 'ALSO', 'AREA', 'ARMY', 'AWAY',
                                    'BABY', 'BACK', 'BALL', 'BAND', 'BANK', 'BASE', 'BATH',
                                    'BEAR', 'BEAT', 'BEEN', 'BEER', 'BELL', 'BELT', 'BEST',
                                    'BIRD', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOMB', 'BOND',
                                    'BONE', 'BOOK', 'BOOM', 'BORN', 'BOSS', 'BOTH', 'BOWL',
                                    'BULK', 'BURN', 'BUSH', 'BUSY', 'CALL', 'CALM', 'CAME',
                                    'CAMP', 'CARD', 'CARE', 'CASE', 'CASH', 'CAST', 'CELL',
                                    'CHAT', 'CHIP', 'CITY', 'CLUB', 'COAL', 'COAT', 'CODE',
                                    'COLD', 'COME', 'COOK', 'COOL', 'COPE', 'COPY', 'CORE',
                                    'COST', 'CREW', 'CROP', 'DARK', 'DATA', 'DATE', 'DAWN',
                                    'DAYS', 'DEAD', 'DEAL', 'DEAR', 'DEBT', 'DEEP', 'DENY',
                                    'DESK', 'DIAL', 'DIET', 'DIRT', 'DISC', 'DISK', 'DOES',
                                    'DONE', 'DOOR', 'DOSE', 'DOWN', 'DRAW', 'DREW', 'DROP',
                                    'DRUG', 'DUAL', 'DUKE', 'DUST', 'DUTY', 'EACH', 'EARN',
                                    'EASE', 'EAST', 'EASY', 'EDGE', 'ELSE', 'EVEN', 'EVER',
                                    'EVIL', 'EXIT', 'FACE', 'FACT', 'FAIL', 'FAIR', 'FALL',
                                    'FARM', 'FAST', 'FATE', 'FEAR', 'FEED', 'FEEL', 'FEET',
                                    'FELL', 'FELT', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE',
                                    'FIRE', 'FIRM', 'FISH', 'FIVE', 'FLAT', 'FLOW', 'FOOD',
                                    'FOOT', 'FORD', 'FORM', 'FORT', 'FOUR', 'FREE', 'FROM',
                                    'FUEL', 'FULL', 'FUND', 'GAIN', 'GAME', 'GATE', 'GAVE',
                                    'GEAR', 'GENE', 'GIFT', 'GIRL', 'GIVE', 'GLAD', 'GOAL'
                                ];
                                
                                isValid = commonFourLetterWords.includes(word.toUpperCase());
                            }
                            
                            if (isValid) {
                                foundWords++;
                                foundWordsList.add(word);
                                console.log(`Found valid 4-letter word: ${word}`);
                                
                                // Break from direction loop if we found enough words
                                if (foundWords >= 4) break;
                            }
                        }
                    }
                }
                
                // Break from row loop if we found enough words
                if (foundWords >= 4) break;
            }
            
            // If we didn't find enough words, regenerate certain tiles
            if (foundWords < 4) {
                console.log(`Only found ${foundWords} valid 4-letter words, regenerating some tiles...`);
                
                // Replace some tiles with more common letters (vowels and common consonants)
                const commonLetters = ['A', 'E', 'I', 'O', 'T', 'N', 'R', 'S', 'L'];
                
                // Replace some random tiles (about 25% of the grid)
                const tilesToReplace = Math.floor(this.gridSize * this.gridSize * 0.25);
                for (let i = 0; i < tilesToReplace; i++) {
                    const row = Math.floor(Math.random() * this.gridSize);
                    const col = Math.floor(Math.random() * this.gridSize);
                    
                    // Only replace if the tile exists
                    if (this.tiles[row][col]) {
                        // Choose a random common letter
                        const letter = commonLetters[Math.floor(Math.random() * commonLetters.length)];
                        
                        // Update the tile
                        this.tiles[row][col].setLetter(letter);
                    }
                }
                
                attempts++;
            }
        }
        
        console.log(`Grid validation complete. Found ${foundWords} valid 4-letter words after ${attempts} attempts.`);
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
        // Create a graphics object for drawing word paths
        this.wordPathGraphics = this.scene.add.graphics();
        
        // Add hover highlight graphics
        this.hoverHighlight = this.scene.add.graphics();
        this.hoverHighlight.visible = true; // Make sure it's visible
        
        // Flag to track whether we need to redraw the path
        this.pathNeedsRedraw = false;
        
        // Reference to the last tile the pointer was over during a drag
        this.lastHoverTile = null;
        
        // Track last pointer position for better diagonal detection
        this.lastPointerX = null;
        this.lastPointerY = null;
        
        // Track diagonal bias (for consistent diagonal movements)
        this.diagonalBias = false;
        
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
                
                // Reset diagonal bias
                this.diagonalBias = false;
                
                // Initialize last pointer position
                this.lastPointerX = pointer.x;
                this.lastPointerY = pointer.y;
                
                // Get the tile under the pointer
                const gridPos = this.pixelToGrid(pointer.x, pointer.y);
                if (gridPos) {
                    const tile = this.tiles[gridPos.row][gridPos.col];
                    if (tile) {
                        // Select the tile with a snap animation
                        this.selectTileWithAnimation(tile);
                        
                        // Mark that the path needs to be redrawn
                        this.pathNeedsRedraw = true;
                    }
                }
            }
        };
        
        this.pointerMoveHandler = (pointer) => {
            // Safety check to make sure the grid still exists
            if (!this.scene || !this.tiles) return;
            
            // Always update hover highlight regardless of selection state
            this.updateHoverHighlight(pointer.x, pointer.y);
            
            // Only proceed with selection if we're actually selecting
            if (!this.isSelecting || this.selectedTiles.length === 0) return;
            
            // Calculate movement vector since last update
            const dx = this.lastPointerX !== null ? pointer.x - this.lastPointerX : 0;
            const dy = this.lastPointerY !== null ? pointer.y - this.lastPointerY : 0;
            
            // Update last pointer position
            this.lastPointerX = pointer.x;
            this.lastPointerY = pointer.y;
            
            // Check if the movement is predominantly diagonal
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const isDiagonalMovement = absDx > 0 && absDy > 0 && 
                                      absDx / absDy > 0.5 && absDx / absDy < 2;
            
            // If we detect diagonal movement, set the diagonal bias
            if (isDiagonalMovement && absDx > 5 && absDy > 5) {
                this.diagonalBias = true;
            }
            
            // Get the tile directly under the pointer
            const directGridPos = this.pixelToGrid(pointer.x, pointer.y);
            if (!directGridPos) return;
            
            const directTile = this.tiles[directGridPos.row][directGridPos.col];
            if (!directTile) return;
            
            // Get the last selected tile
            const lastSelectedTile = this.selectedTiles[this.selectedTiles.length - 1];
            
            // Only process if the pointer is over a different tile
            if (directTile !== this.lastHoverTile) {
                this.lastHoverTile = directTile;
                
                // If this is a diagonal from our last tile, prioritize it
                const isDiagonal = Math.abs(lastSelectedTile.gridX - directTile.gridX) === 1 && 
                                  Math.abs(lastSelectedTile.gridY - directTile.gridY) === 1;
                
                // Check if the tile is adjacent to the last selected tile
                if (this.isAdjacent(lastSelectedTile, directTile)) {
                    // Check if tile is already selected
                    const index = this.selectedTiles.indexOf(directTile);
                    
                    if (index === -1) {
                        // Not selected yet, add it with animation
                        this.selectTileWithAnimation(directTile);
                        this.pathNeedsRedraw = true;
                        
                        // Update diagonal bias based on this selection
                        if (isDiagonal) {
                            this.diagonalBias = true;
                        } else if (this.diagonalBias) {
                            // Reset diagonal bias if we made a non-diagonal move
                            this.diagonalBias = false;
                        }
                    } else if (index === this.selectedTiles.length - 2) {
                        // Going back one step - undo the last selection
                        if (this.selectedTiles.length > 1) {
                            this.unselectTileWithAnimation(this.selectedTiles[this.selectedTiles.length - 1]);
                            this.pathNeedsRedraw = true;
                        }
                    }
                }
            } else if (this.diagonalBias) {
                // Even if we haven't moved to a new tile, let's check for diagonal options
                // when the user has a diagonal bias in their movement
                
                const lastSelectedTile = this.selectedTiles[this.selectedTiles.length - 1];
                
                // Get movement direction
                const dirX = Math.sign(dx);
                const dirY = Math.sign(dy);
                
                // If we have a clear diagonal direction
                if (dirX !== 0 && dirY !== 0) {
                    // Try to find the diagonal tile in that direction
                    const diagRow = lastSelectedTile.gridY + dirY;
                    const diagCol = lastSelectedTile.gridX + dirX;
                    
                    // Check if it's a valid position
                    if (diagRow >= 0 && diagRow < this.gridSize && diagCol >= 0 && diagCol < this.gridSize) {
                        const diagTile = this.tiles[diagRow][diagCol];
                        
                        // If it's not already selected and not our current tile
                        if (diagTile && !this.selectedTiles.includes(diagTile) && diagTile !== directTile) {
                            // Calculate distance to the diagonal tile
                            const tileX = diagTile.background.x;
                            const tileY = diagTile.background.y;
                            const dist = Math.sqrt(Math.pow(pointer.x - tileX, 2) + Math.pow(pointer.y - tileY, 2));
                            
                            // If we're reasonably close to the diagonal tile
                            if (dist < this.tileSize * 0.8) {
                                // Select it
                                this.selectTileWithAnimation(diagTile);
                                this.lastHoverTile = diagTile;
                                this.pathNeedsRedraw = true;
                            }
                        }
                    }
                }
            }
        };
        
        this.pointerUpHandler = () => {
            // Safety check to make sure the grid still exists
            if (!this.scene || !this.isSelecting) return;
            
            this.isSelecting = false;
            this.lastHoverTile = null;
            this.lastPointerX = null;
            this.lastPointerY = null;
            this.diagonalBias = false;
            
            // Clear hover highlight
            this.hoverHighlight.clear();
            
            // Process the selected word
            if (this.selectedTiles.length >= 3) {
                this.processWord();
            } else {
                // Not enough letters, clear selection
                this.clearSelection();
            }
            
            // Clear the path
            this.wordPathGraphics.clear();
            this.pathNeedsRedraw = false;
        };
        
        // Add input handlers
        this.scene.input.on('pointerdown', this.pointerDownHandler);
        this.scene.input.on('pointermove', this.pointerMoveHandler);
        this.scene.input.on('pointerup', this.pointerUpHandler);
    }
    
    /**
     * Draw the path between selected tiles to visualize the word
     */
    drawSelectionPath() {
        // Clear previous path
        this.wordPathGraphics.clear();
        
        // Need at least 2 tiles to draw a path
        if (this.selectedTiles.length < 2) return;
        
        // Use consistent line settings as base
        const lineWidth = 8;
        const lineColor = 0x66eeff;
        const lineAlpha = 0.85;
        
        // Draw lines connecting all tiles in selection order
        for (let i = 0; i < this.selectedTiles.length - 1; i++) {
            const fromTile = this.selectedTiles[i];
            const toTile = this.selectedTiles[i + 1];
            
            const fromX = fromTile.background.x;
            const fromY = fromTile.background.y;
            const toX = toTile.background.x;
            const toY = toTile.background.y;
            
            // Check if this is a diagonal connection
            const isDiagonal = Math.abs(fromTile.gridX - toTile.gridX) === 1 && 
                              Math.abs(fromTile.gridY - toTile.gridY) === 1;
            
            if (isDiagonal) {
                // For diagonal connections, use a distinct pulsing effect
                // First draw a slightly wider base line
                this.wordPathGraphics.lineStyle(lineWidth, lineColor, lineAlpha * 0.7);
                this.wordPathGraphics.beginPath();
                this.wordPathGraphics.moveTo(fromX, fromY);
                this.wordPathGraphics.lineTo(toX, toY);
                this.wordPathGraphics.strokePath();
                
                // Then add a second line with a different color
                this.wordPathGraphics.lineStyle(lineWidth * 0.6, 0xffffff, lineAlpha * 0.6);
                this.wordPathGraphics.beginPath();
                this.wordPathGraphics.moveTo(fromX, fromY);
                this.wordPathGraphics.lineTo(toX, toY);
                this.wordPathGraphics.strokePath();
                
                // Add a subtle directional indicator (small arrow)
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                this.wordPathGraphics.fillStyle(0xffffff, 0.8);
                this.wordPathGraphics.fillCircle(midX, midY, lineWidth * 0.4);
            } else {
                // For orthogonal connections, use standard line
                this.wordPathGraphics.lineStyle(lineWidth, lineColor, lineAlpha);
                this.wordPathGraphics.beginPath();
                this.wordPathGraphics.moveTo(fromX, fromY);
                this.wordPathGraphics.lineTo(toX, toY);
                this.wordPathGraphics.strokePath();
            }
        }
        
        // Now add highlight dots at the connection points
        for (let i = 0; i < this.selectedTiles.length; i++) {
            const tile = this.selectedTiles[i];
            const x = tile.background.x;
            const y = tile.background.y;
            
            // Draw a simple highlight that scales with the tile size
            this.wordPathGraphics.fillStyle(0xaaffff, 0.7);
            this.wordPathGraphics.fillCircle(x, y, lineWidth * 0.9);
            
            // Add a small white center for a subtle highlight
            this.wordPathGraphics.fillStyle(0xffffff, 0.5);
            this.wordPathGraphics.fillCircle(x, y, lineWidth * 0.4);
        }
    }
    
    /**
     * Get the nearest valid tile to the pointer position
     * Uses a more forgiving approach to help with diagonal selections
     * @param {number} x - Pointer X coordinate
     * @param {number} y - Pointer Y coordinate
     * @returns {Tile|null} - The nearest valid tile or null if none found
     */
    getNearestTileToPointer(x, y) {
        // This method is now replaced by getNearestTileInDirection
        // This is kept for backwards compatibility
        return this.getNearestTileInDirection(x, y, { dr: 0, dc: 0 });
    }
    
    /**
     * Highlight valid next moves to make selection easier
     * This helps players see which tiles they can select next
     */
    highlightValidNextMoves() {
        // Clear previous highlights
        this.validMoveHighlights.clear();
        
        // If no tiles selected yet, nothing to highlight
        if (this.selectedTiles.length === 0) return;
        
        // Get the last selected tile
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        
        // Set style for highlights
        this.validMoveHighlights.fillStyle(0xaaffff, 0.2);
        this.validMoveHighlights.lineStyle(2, 0x55ddff, 0.4);
        
        // Check all 8 adjacent positions
        const directions = [
            { dr: -1, dc: 0 },  // Up
            { dr: -1, dc: 1 },  // Up-Right
            { dr: 0, dc: 1 },   // Right
            { dr: 1, dc: 1 },   // Down-Right
            { dr: 1, dc: 0 },   // Down
            { dr: 1, dc: -1 },  // Down-Left
            { dr: 0, dc: -1 },  // Left
            { dr: -1, dc: -1 }  // Up-Left
        ];
        
        for (const dir of directions) {
            const newRow = lastTile.gridY + dir.dr;
            const newCol = lastTile.gridX + dir.dc;
            
            // Check if in bounds
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                const tile = this.tiles[newRow][newCol];
                
                // Skip if the tile is already selected (except for the previous tile for backtracking)
                if (tile && this.selectedTiles.indexOf(tile) === -1) {
                    
                    // Get tile center position
                    const tileX = this.x + (newCol + 0.5) * this.tileSize;
                    const tileY = this.y + (newRow + 0.5) * this.tileSize;
                    
                    // Draw highlight circle
                    this.validMoveHighlights.fillCircle(tileX, tileY, this.tileSize * 0.4);
                    this.validMoveHighlights.strokeCircle(tileX, tileY, this.tileSize * 0.4);
                    
                    // If this is a diagonal, add a directional indicator
                    if (dir.dr !== 0 && dir.dc !== 0) {
                        // Draw a small arrow from last tile to this one
                        const lastTileX = this.x + (lastTile.gridX + 0.5) * this.tileSize;
                        const lastTileY = this.y + (lastTile.gridY + 0.5) * this.tileSize;
                        
                        // Calculate arrow points
                        const dx = tileX - lastTileX;
                        const dy = tileY - lastTileY;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const nx = dx / length; // Normalized direction vector
                        const ny = dy / length;
                        
                        // Draw diagonal indicator - a small centered line
                        this.validMoveHighlights.lineStyle(4, 0x55ddff, 0.6);
                        this.validMoveHighlights.beginPath();
                        this.validMoveHighlights.moveTo(
                            lastTileX + nx * this.tileSize * 0.2,
                            lastTileY + ny * this.tileSize * 0.2
                        );
                        this.validMoveHighlights.lineTo(
                            lastTileX + nx * this.tileSize * 0.5,
                            lastTileY + ny * this.tileSize * 0.5
                        );
                        this.validMoveHighlights.strokePath();
                    }
                }
            }
        }
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
        
        // Clear the path visualization
        if (this.wordPathGraphics) {
            this.wordPathGraphics.clear();
        }
        
        // Reset path redraw flag
        this.pathNeedsRedraw = false;
    }
    
    /**
     * Update method to be called each frame
     * Handles path drawing and diagonal hint displays
     */
    update() {
        // Only redraw the path if necessary
        if (this.pathNeedsRedraw && this.selectedTiles.length > 1) {
            this.drawSelectionPath();
            this.pathNeedsRedraw = false;
        }
        
        // Show diagonal hints when user is selecting
        if (this.isSelecting && this.selectedTiles.length > 0) {
            this.showDiagonalHints();
        }
    }
    
    /**
     * Show hints for diagonal movements
     * Makes diagonal selection more discoverable and intentional
     */
    showDiagonalHints() {
        // Only show hints when we have at least one selected tile
        if (this.selectedTiles.length === 0) return;
        
        // Get the last selected tile
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        
        // We'll show hints only when there's no current hover highlight
        if (this.hoverHighlight.visible && this.lastHoverTile) return;
        
        // Check for valid diagonal moves from the last tile
        const diagonalDirections = [
            { dr: -1, dc: -1 }, // Up-Left
            { dr: -1, dc: 1 },  // Up-Right
            { dr: 1, dc: -1 },  // Down-Left
            { dr: 1, dc: 1 }    // Down-Right
        ];
        
        // If we have a diagonal bias, add subtle hints for diagonal connections
        if (this.diagonalBias) {
            for (const dir of diagonalDirections) {
                const newRow = lastTile.gridY + dir.dr;
                const newCol = lastTile.gridX + dir.dc;
                
                // Make sure it's in bounds
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize) {
                    
                    const diagonalTile = this.tiles[newRow][newCol];
                    
                    // Skip if it's already selected
                    if (!diagonalTile || this.selectedTiles.includes(diagonalTile)) continue;
                    
                    // Draw a subtle hint toward this diagonal tile
                    const fromX = lastTile.background.x;
                    const fromY = lastTile.background.y;
                    const toX = diagonalTile.background.x;
                    const toY = diagonalTile.background.y;
                    
                    // For the hint, show a subtle dotted line
                    this.hoverHighlight.lineStyle(2, 0x88ddff, 0.4);
                    
                    // Draw a dotted line (using small segments)
                    const segments = 6;
                    for (let i = 1; i <= segments; i += 2) {
                        const startPct = i / segments;
                        const endPct = (i + 0.5) / segments;
                        
                        const startX = fromX + (toX - fromX) * startPct;
                        const startY = fromY + (toY - fromY) * startPct;
                        const endX = fromX + (toX - fromX) * endPct;
                        const endY = fromY + (toY - fromY) * endPct;
                        
                        this.hoverHighlight.beginPath();
                        this.hoverHighlight.moveTo(startX, startY);
                        this.hoverHighlight.lineTo(endX, endY);
                        this.hoverHighlight.strokePath();
                    }
                }
            }
        }
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
     * Update the hover highlight to show which tile the pointer is over
     * @param {number} x - Pointer X coordinate 
     * @param {number} y - Pointer Y coordinate
     */
    updateHoverHighlight(x, y) {
        this.hoverHighlight.clear();
        
        // Only show hover if we're selecting
        if (!this.isSelecting) return;
        
        // Get the tile under the pointer
        const gridPos = this.pixelToGrid(x, y);
        if (!gridPos) return;
        
        const tileUnderPointer = this.tiles[gridPos.row][gridPos.col];
        if (!tileUnderPointer) return;
        
        // Don't highlight already selected tiles
        if (this.selectedTiles.includes(tileUnderPointer)) return;
        
        // Get the last selected tile
        const lastSelectedTile = this.selectedTiles.length > 0 ? 
            this.selectedTiles[this.selectedTiles.length - 1] : null;
        
        // Only highlight if adjacent to the last selected tile
        if (lastSelectedTile && this.isAdjacent(lastSelectedTile, tileUnderPointer)) {
            // Get the center position of the tile
            const tileX = tileUnderPointer.background.x;
            const tileY = tileUnderPointer.background.y;
            
            // Check if this is a diagonal movement
            const isDiagonal = Math.abs(lastSelectedTile.gridX - tileUnderPointer.gridX) === 1 && 
                              Math.abs(lastSelectedTile.gridY - tileUnderPointer.gridY) === 1;
            
            // Use different highlight styles for diagonal vs orthogonal
            if (isDiagonal) {
                // Brighter highlight for diagonal to emphasize it
                this.hoverHighlight.fillStyle(0xaaffff, 0.4);
                this.hoverHighlight.lineStyle(4, 0x55eeff, 0.8);
                
                // Draw diamond shape to indicate diagonal connection
                const size = this.tileSize * 0.4;
                const points = [
                    tileX, tileY - size,       // top
                    tileX + size, tileY,       // right
                    tileX, tileY + size,       // bottom
                    tileX - size, tileY,       // left
                ];
                this.hoverHighlight.fillPoints(points, true);
                this.hoverHighlight.strokePoints(points, true);
                
                // Draw line connecting from last tile to this one
                const lastX = lastSelectedTile.background.x;
                const lastY = lastSelectedTile.background.y;
                this.hoverHighlight.lineStyle(3, 0x55eeff, 0.5);
                this.hoverHighlight.lineBetween(lastX, lastY, tileX, tileY);
            } else {
                // Standard circle for orthogonal
                this.hoverHighlight.fillStyle(0xffffff, 0.3);
                this.hoverHighlight.lineStyle(3, 0x88ddff, 0.7);
                this.hoverHighlight.fillCircle(tileX, tileY, this.tileSize * 0.45);
                this.hoverHighlight.strokeCircle(tileX, tileY, this.tileSize * 0.45);
            }
        }
    }
    
    /**
     * Select a tile with a snap animation
     * @param {Tile} tile - The tile to select
     */
    selectTileWithAnimation(tile) {
        // Only add if not already selected
        if (!this.selectedTiles.includes(tile)) {
            this.selectedTiles.push(tile);
            
            // Make sure the tile's setSelected method exists
            if (typeof tile.setSelected === 'function') {
                tile.setSelected(true);
            }
            
            // Add a snap animation
            this.scene.tweens.add({
                targets: tile.container,
                scaleX: { from: 1.1, to: 1 },
                scaleY: { from: 1.1, to: 1 },
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            // Play a selection sound if available
            // if (this.scene.sound && this.scene.sound.add) {
            //     this.scene.sound.play('select');
            // }
        }
    }
    
    /**
     * Unselect a tile with animation
     * @param {Tile} tile - The tile to unselect
     */
    unselectTileWithAnimation(tile) {
        const index = this.selectedTiles.indexOf(tile);
        if (index !== -1) {
            // Remove from array first
            this.selectedTiles.splice(index, 1);
            
            // Then update the tile's visual state if the method exists
            if (typeof tile.setSelected === 'function') {
                tile.setSelected(false);
            }
            
            // Add a quick shrink animation
            this.scene.tweens.add({
                targets: tile.container,
                scaleX: { from: 0.9, to: 1 },
                scaleY: { from: 0.9, to: 1 },
                duration: 100,
                ease: 'Sine.easeOut'
            });
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
            
            // Clean up the graphics
            if (this.wordPathGraphics) {
                this.wordPathGraphics.clear();
                this.wordPathGraphics.destroy();
                this.wordPathGraphics = null;
            }
            
            if (this.hoverHighlight) {
                this.hoverHighlight.clear();
                this.hoverHighlight.destroy();
                this.hoverHighlight = null;
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
            this.lastHoverTile = null;
            
            console.log("Grid cleanup complete");
        } catch (error) {
            console.error("Error during grid cleanup:", error);
        }
    }
}
