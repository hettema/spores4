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
            
            // Calculate number of spores to release (reduced from original word length)
            // Limit to 1-2 spores per explosion to prevent cascades from going too fast
            const sporeCount = Math.min(2, Math.ceil(tiles.length / 3));
            
            // Spread spores to random tiles
            const spreadSpores = () => {
                for (let i = 0; i < sporeCount; i++) {
                    // Find a random tile that isn't exploding
                    let randomRow, randomCol;
                    let randomTile;
                    let attempts = 0;
                    
                    do {
                        randomRow = Math.floor(Math.random() * this.gridSize);
                        randomCol = Math.floor(Math.random() * this.gridSize);
                        randomTile = this.tiles[randomRow]?.[randomCol];
                        attempts++;
                    } while ((!randomTile || tilesToExplode.includes(randomTile) || tilesExploded.has(randomTile)) && attempts < 30);
                    
                    // If we found a valid tile after several attempts, add a spore
                    if (randomTile && !tilesToExplode.includes(randomTile) && !tilesExploded.has(randomTile)) {
                        const exploded = randomTile.addSpores(1);
                        console.log(`Added spore to tile at [${randomRow}][${randomCol}], now has ${randomTile.sporeCount} spores`);
                        
                        // If it reached threshold, queue it for explosion
                        if (exploded && !tilesToExplode.includes(randomTile)) {
                            tilesToExplode.push(randomTile);
                            console.log(`Tile at [${randomRow}][${randomCol}] reached threshold, adding to explosion queue`);
                            
                            // If this is a cascade (not in the original word)
                            if (!tiles.includes(randomTile)) {
                                cascadeCount++;
                            }
                        }
                    }
                }
                
                // Process next explosion with a slight delay for visual effect
                this.scene.time.delayedCall(80, processExplosions); // Increased delay for better visibility
            };
            
            // Delay spore spreading for visual effect
            this.scene.time.delayedCall(50, spreadSpores);
        });
    };
    
    // Start with processing explosions one by one
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