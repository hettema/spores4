/**
 * Represents a single letter tile in the grid
 */
class Tile {
    /**
     * Create a new tile
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} x - X position
     * @param {number} y - Y position 
     * @param {number} gridX - Grid X position (column)
     * @param {number} gridY - Grid Y position (row)
     * @param {string} letter - The letter on the tile
     * @param {number} size - The size of the tile
     */
    constructor(scene, x, y, gridX, gridY, letter, size) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.letter = letter;
        this.sporeCount = 0;
        this.sporeThreshold = 5; // Number of spores needed to explode
        this.selected = false;
        this.size = size;
        
        // Initialize container array
        this.container = [];
        this.backgroundGroup = [];
        
        // Create the tile with a basic shape
        this.createMushroomTile(x, y, size, 0xfffff0);
        
        // Create the letter text with enhanced contrast and readability
        this.letterText = scene.add.text(x, y, letter, {
            fontFamily: 'Arial',
            fontSize: Math.floor(size * 0.5) + 'px',
            fontWeight: 'bold',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3,
            shadow: { offsetX: 1, offsetY: 1, color: '#ffffff', blur: 3, fill: true }
        }).setOrigin(0.5);
        
        // Ensure letter text is always on top of other elements
        this.letterText.setDepth(10);
        
        // Create score text - bottom right corner
        this.scoreText = scene.add.text(
            x + (size * 0.3), 
            y + (size * 0.3), 
            LetterData.getPointValue(letter).toString(), 
            { 
                fontFamily: 'Arial', 
                fontSize: Math.floor(size * 0.25) + 'px', 
                color: '#222222',
                stroke: '#ffffff',
                strokeThickness: 1
            }
        ).setOrigin(0.5);
        
        // Create spore counter text - bottom left corner
        this.sporeText = scene.add.text(
            x - (size * 0.3), 
            y + (size * 0.3), 
            '0', 
            { 
                fontFamily: 'Arial', 
                fontSize: Math.floor(size * 0.25) + 'px', 
                color: '#008800',
                stroke: '#ffffff',
                strokeThickness: 1
            }
        ).setOrigin(0.5);
        this.sporeText.setVisible(false); // Hide initially
        
        // Add all elements to the container for easy manipulation
        this.container = [this.background, this.letterText, this.scoreText, this.sporeText];
        
        // Apply initial appearance
        this.updateAppearance();
    }
    
    /**
     * Create a mushroom cap shaped tile
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Size of the tile
     * @param {number} color - Color of the mushroom cap
     */
    createMushroomTile(x, y, size, color) {
        // If we already have a background, destroy it
        if (this.background) {
            this.background.destroy();
        }
        
        // If we have highlight elements, destroy them too
        if (this.backgroundGroup) {
            this.backgroundGroup.forEach(item => {
                if (item && item !== this.background && typeof item.destroy === 'function') {
                    item.destroy();
                }
            });
        }
        
        try {
            // Create a more Scrabble-like tile but with subtle mushroom styling
            const visualElements = [];
            
            // Create the main background shape - rounded square for Scrabble-like feel
            this.background = this.scene.add.rectangle(x, y, size * 0.8, size * 0.8, color, 1);
            this.background.setStrokeStyle(2, 0x888888, 0.5);
            
            // Add a slight curvature to suggest a mushroom cap but with reduced opacity
            // Position it slightly higher to avoid overlapping with letters
            const topCurve = this.scene.add.rectangle(x, y - size * 0.28, size * 0.8, size * 0.25, color);
            topCurve.setAlpha(0.4); // Reduced opacity for better letter visibility
            visualElements.push(topCurve);
            
            // Add subtle highlight to give 3D effect
            const highlight = this.scene.add.rectangle(
                x - size * 0.15, 
                y - size * 0.2, // Positioned higher to avoid letters
                size * 0.4, 
                size * 0.3, 
                0xffffff
            );
            highlight.setAlpha(0.15); // Reduced opacity for better letter visibility
            visualElements.push(highlight);
            
            // Add a very subtle shadow underneath
            const shadow = this.scene.add.rectangle(
                x + size * 0.05,
                y + size * 0.3,
                size * 0.75,
                size * 0.2,
                0x000000
            );
            shadow.setAlpha(0.1);
            visualElements.push(shadow);
            
            // Make the background interactive
            this.background.setInteractive();
            
            // Store all visual elements for management
            this.backgroundGroup = [this.background, ...visualElements];
            
        } catch (e) {
            console.error("Error creating tile:", e);
            
            // Ultra-simple fallback in case of errors
            this.background = this.scene.add.rectangle(x, y, size * 0.75, size * 0.75, color);
            this.background.setInteractive();
            this.backgroundGroup = [this.background];
        }
    }
    
    /**
     * Set the position of the tile
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setPosition(x, y) {
        this.background.setPosition(x, y);
        this.letterText.setPosition(x, y);
        
        // Ensure spore and score text are positioned at corners
        this.scoreText.setPosition(x + (this.size * 0.3), y + (this.size * 0.3));
        this.sporeText.setPosition(x - (this.size * 0.3), y + (this.size * 0.3));
    }
    
    /**
     * Mark the tile as selected
     * @param {boolean} isSelected - Whether the tile is selected
     */
    setSelected(isSelected) {
        this.selected = isSelected;
        this.updateAppearance(); // Use our updateAppearance method to handle the visual change
    }
    
    /**
     * Add spores to the tile
     * @param {number} count - Number of spores to add
     * @returns {boolean} Whether the tile exploded
     */
    addSpores(count) {
        this.sporeCount += count;
        
        // Update spore text and make it visible
        this.sporeText.setText(this.sporeCount.toString());
        this.sporeText.setVisible(true);
        
        // Ensure the spore text stays in the correct position
        const x = this.background.x;
        const y = this.background.y;
        this.sporeText.setPosition(x - (this.size * 0.3), y + (this.size * 0.3));
        
        // Update the tile's appearance based on spore count
        this.updateAppearance();
        
        // Check if the tile should explode
        if (this.sporeCount >= this.sporeThreshold) {
            return true; // Tile should explode
        }
        
        return false;
    }
    
    /**
     * Reset the tile's spore count
     */
    resetSpores() {
        this.sporeCount = 0;
        this.sporeText.setText('0');
        this.sporeText.setVisible(false);
        this.updateAppearance();
    }
    
    /**
     * Update the tile's appearance based on its state
     */
    updateAppearance() {
        // Handle selection state
        if (this.selected) {
            // Highlight with blue when selected
            if (this.background) {
                this.background.setFillStyle(0x88eeff);
            }
            this.letterText.setColor('#ffffff');
            this.letterText.setStroke('#225588', 2); // Add stroke for better contrast when selected
            return;
        }
        
        // Use a simplified color progression based on spore count
        let color;
        if (this.sporeCount === 0) {
            // Base color for tiles with no spores
            color = 0xfffff0; // Slight cream tint
            this.letterText.setColor('#000000'); // Black text
            this.letterText.setStroke('#ffffff', 2); // White outline for contrast
            
            // Reset any scale changes
            if (this.background) {
                this.background.setScale(1);
            }
            this.letterText.setScale(1);
            
            // Remove any glow or particles
            if (this.leakEmitter) {
                this.leakEmitter.stop();
            }
            
            // Show or hide spore counter
            this.sporeText.setVisible(false);
        } else {
            // Show spore counter
            this.sporeText.setVisible(true);
            this.sporeText.setText(this.sporeCount.toString());
            
            // Calculate progress toward explosion
            const progress = Math.min(this.sporeCount / this.sporeThreshold, 0.99);
            
            // Use a color progression that works with our simplified tile style
            if (progress < 0.33) {
                // Light green
                color = 0xb8e2b8;
                this.sporeText.setColor('#44cc44');
                this.letterText.setColor('#000000'); // Black text
                this.letterText.setStroke('#ffffff', 3); // Thicker white outline for better contrast
                
                // Subtle scaling
                const scale = 1 + (progress * 0.1);
                if (this.background) {
                    this.background.setScale(scale);
                }
            } else if (progress < 0.66) {
                // Medium green
                color = 0x88cc88;
                this.sporeText.setColor('#66dd33');
                this.letterText.setColor('#000000'); // Keep black text
                this.letterText.setStroke('#ffffff', 3); // Thicker white outline
                this.letterText.setShadow(1, 1, '#ffffff', 3, true); // Add white shadow for better readability
                
                // More noticeable scaling
                const scale = 1 + (progress * 0.15);
                if (this.background) {
                    this.background.setScale(scale);
                }
                
                // Add subtle pulsing to indicate growing energy
                if (!this.pulseTween) {
                    try {
                        this.pulseTween = this.scene.tweens.add({
                            targets: [this.background],
                            scaleX: { from: scale * 0.97, to: scale * 1.03 },
                            scaleY: { from: scale * 0.97, to: scale * 1.03 },
                            duration: 1200,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    } catch (e) {
                        console.error("Could not create pulse tween:", e);
                    }
                }
            } else {
                // Dark green/teal - about to explode
                color = 0x55aa77;
                this.sporeText.setColor('#ffff00');
                this.letterText.setColor('#ffffff'); // White text for maximum contrast
                this.letterText.setStroke('#000000', 4); // Thicker black outline
                this.letterText.setShadow(1, 1, '#000000', 3, true); // Add shadow for better contrast
                
                // Maximum scaling
                const scale = 1 + (progress * 0.2);
                if (this.background) {
                    this.background.setScale(scale);
                }
                
                // More intense pulsing
                if (this.pulseTween) {
                    try {
                        this.pulseTween.updateTo({
                            scaleX: { from: scale * 0.95, to: scale * 1.05 },
                            scaleY: { from: scale * 0.95, to: scale * 1.05 },
                            duration: 800
                        }, true);
                    } catch (e) {
                        // If update fails, recreate the tween
                        try {
                            this.pulseTween = this.scene.tweens.add({
                                targets: [this.background],
                                scaleX: { from: scale * 0.95, to: scale * 1.05 },
                                scaleY: { from: scale * 0.95, to: scale * 1.05 },
                                duration: 800,
                                yoyo: true,
                                repeat: -1,
                                ease: 'Sine.easeInOut'
                            });
                        } catch (e) {
                            console.error("Could not create pulse tween:", e);
                        }
                    }
                }
                
                // Add a glow effect for tiles about to explode
                try {
                    if (this.background && !this.glowGraphic) {
                        const x = this.background.x;
                        const y = this.background.y;
                        
                        // Create glow behind the letter with lower opacity
                        this.glowGraphic = this.scene.add.rectangle(x, y, this.size * 0.9, this.size * 0.9, 0xaaffaa, 0.15);
                        // Set a lower depth to ensure it appears below the letter
                        this.glowGraphic.setDepth(5);
                        this.scene.tweens.add({
                            targets: this.glowGraphic,
                            alpha: 0.2,
                            scale: 1.1,
                            duration: 600,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                } catch (e) {
                    console.error("Could not create glow effect:", e);
                }
                
                // Add leaking spore particles for tiles near explosion threshold
                if (this.sporeCount >= this.sporeThreshold - 1 && !this.leakEmitter) {
                    const x = this.background.x;
                    const y = this.background.y;
                    this.createLeakingSporeEffect(x, y);
                }
            }
        }
        
        // Update the color
        if (this.background) {
            try {
                // Try to set fill style if it's a method
                if (typeof this.background.setFillStyle === 'function') {
                    this.background.setFillStyle(color);
                } 
                // For older Phaser versions or different shape types
                else if (typeof this.background.fillColor !== 'undefined') {
                    this.background.fillColor = color;
                }
                // If all else fails, try to set tint
                else if (typeof this.background.setTint === 'function') {
                    this.background.setTint(color);
                }
            } catch (e) {
                console.log("Could not set color:", e);
            }
        }
        
        // Make sure glow effect follows the tile
        if (this.glowGraphic && this.background) {
            this.glowGraphic.setPosition(this.background.x, this.background.y);
        }
        
        // Make sure score and spore text positions are correct
        const x = this.background ? this.background.x : 0;
        const y = this.background ? this.background.y : 0;
        
        // Position the letter text
        this.letterText.setPosition(x, y);
        
        // Keep score and spore text at fixed sizes and positions
        this.scoreText.setScale(1);
        this.sporeText.setScale(1);
        this.scoreText.setPosition(x + (this.size * 0.3), y + (this.size * 0.3));
        this.sporeText.setPosition(x - (this.size * 0.3), y + (this.size * 0.3));
    }
    
    /**
     * Create a small leaking spore effect for tiles near explosion threshold
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createLeakingSporeEffect(x, y) {
        try {
            // Instead of using particle emitter which is causing problems,
            // just create a few simple animated circles
            for (let i = 0; i < 5; i++) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = this.size * 0.4;
                const startX = x + Math.cos(angle) * distance;
                const startY = y + Math.sin(angle) * distance;
                
                // Create a simple green circle
                const spore = this.scene.add.circle(
                    startX, startY, 
                    Phaser.Math.FloatBetween(1.5, 3), 
                    0xaaffaa, 
                    Phaser.Math.FloatBetween(0.5, 0.8)
                );
                
                // Animate it floating away
                this.scene.tweens.add({
                    targets: spore,
                    x: startX + Phaser.Math.FloatBetween(-15, 15),
                    y: startY + Phaser.Math.FloatBetween(-15, 15),
                    alpha: 0,
                    scale: 0.5,
                    duration: Phaser.Math.Between(800, 1500),
                    onComplete: () => spore.destroy()
                });
            }
        } catch (e) {
            console.error("Error creating leaking spore effect:", e);
        }
    }
    
    /**
     * Animate the tile's explosion
     * @param {Function} onComplete - Callback when animation completes
     */
    animateExplosion(onComplete) {
        // Enhanced explosion animation with proper error handling
        try {
            // Gather position information
            const centerX = this.background ? this.background.x : 0;
            const centerY = this.background ? this.background.y : 0;
            
            // Hide the original tile
            if (this.background) this.background.setVisible(false);
            if (this.letterText) this.letterText.setVisible(false);
            if (this.scoreText) this.scoreText.setVisible(false);
            if (this.sporeText) this.sporeText.setVisible(false);
            
            // Hide all other visual elements
            if (this.backgroundGroup) {
                this.backgroundGroup.forEach(item => {
                    if (item && typeof item.setVisible === 'function') {
                        item.setVisible(false);
                    }
                });
            }
            
            // Hide glow effect if it exists
            if (this.glowGraphic && typeof this.glowGraphic.destroy === 'function') {
                this.glowGraphic.destroy();
                this.glowGraphic = null;
            }
            
            // Stop pulse tween if it exists
            if (this.pulseTween) {
                this.pulseTween.stop();
                this.pulseTween = null;
            }
            
            // Stop leak emitter if it exists
            if (this.leakEmitter) {
                this.leakEmitter.stop();
            }
            
            // Create explosion effect components
            const explosionElements = [];
            
            // 1. Create multiple layers of bright flash at the center
            const flash1 = this.scene.add.circle(centerX, centerY, this.size * 0.6, 0xffffff);
            flash1.setAlpha(0.95);
            explosionElements.push(flash1);
            
            const flash2 = this.scene.add.circle(centerX, centerY, this.size * 0.4, 0xffffdd);
            flash2.setAlpha(0.9);
            explosionElements.push(flash2);
            
            // Animate the flashes with different speeds for better effect
            this.scene.tweens.add({
                targets: flash1,
                alpha: 0,
                scale: 3.0,
                duration: 350,
                ease: 'Cubic.easeOut',
                onComplete: () => flash1.destroy()
            });
            
            this.scene.tweens.add({
                targets: flash2,
                alpha: 0,
                scale: 2.5,
                duration: 250,
                ease: 'Cubic.easeOut',
                onComplete: () => flash2.destroy()
            });
            
            // 2. Create multiple shockwave rings with different colors and speeds
            const shockwave1 = this.scene.add.circle(centerX, centerY, this.size * 0.4, 0x88ff88);
            shockwave1.setStrokeStyle(3, 0xaaffaa);
            shockwave1.setFillStyle(0x88ff88, 0.1);
            explosionElements.push(shockwave1);
            
            const shockwave2 = this.scene.add.circle(centerX, centerY, this.size * 0.35, 0xddffdd);
            shockwave2.setStrokeStyle(2, 0xccffcc);
            shockwave2.setFillStyle(0xeeffee, 0.15);
            explosionElements.push(shockwave2);
            
            // Animate the shockwaves with different speeds and sizes
            this.scene.tweens.add({
                targets: shockwave1,
                scale: 3.5,
                alpha: 0,
                duration: 450,
                ease: 'Cubic.easeOut',
                onComplete: () => shockwave1.destroy()
            });
            
            this.scene.tweens.add({
                targets: shockwave2,
                scale: 3,
                alpha: 0,
                duration: 350,
                ease: 'Cubic.easeOut',
                onComplete: () => shockwave2.destroy()
            });
            
            // 3. Create flying spores (particles) with improved visuals
            const particleCount = 16; // Increased particle count
            const particles = [];
            
            // Create radial bursts of spores - now with multiple layers
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = this.size * 0.2;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                // Create more varied spore particles with better visuals
                let particleColor;
                let particleSize;
                let particleType;
                
                if (i % 4 === 0) {
                    // Brightest green spores
                    particleColor = 0xccffcc;
                    particleSize = this.size * 0.15;
                    particleType = 'circle';
                } else if (i % 4 === 1) {
                    // Medium bright green spores
                    particleColor = 0xaaddaa;
                    particleSize = this.size * 0.12;
                    particleType = 'circle';
                } else if (i % 4 === 2) {
                    // Medium green spores
                    particleColor = 0x88bb88;
                    particleSize = this.size * 0.1;
                    particleType = 'circle';
                } else {
                    // Small pale green spores
                    particleColor = 0x66aa66;
                    particleSize = this.size * 0.08;
                    particleType = 'circle';
                }
                
                // Create particle with chosen shape
                let particle;
                if (particleType === 'circle') {
                    particle = this.scene.add.circle(x, y, particleSize, particleColor);
                    
                    // Add highlight to particle for more depth
                    const highlight = this.scene.add.circle(x, y, particleSize * 0.6, 0xffffff);
                    highlight.setAlpha(0.3);
                    explosionElements.push(highlight);
                    
                    // Animate highlight along with the particle
                    this.scene.tweens.add({
                        targets: highlight,
                        x: centerX + Math.cos(angle) * this.size * Phaser.Math.FloatBetween(1.0, 1.8),
                        y: centerY + Math.sin(angle) * this.size * Phaser.Math.FloatBetween(1.0, 1.8),
                        alpha: 0,
                        scale: 0.5,
                        duration: Phaser.Math.Between(350, 650),
                        ease: 'Cubic.easeOut',
                        onComplete: () => highlight.destroy()
                    });
                }
                
                particle.setAlpha(0.9);
                particles.push(particle);
                explosionElements.push(particle);
                
                // Randomize the explosion path with more varied trajectories
                const finalDistance = this.size * Phaser.Math.FloatBetween(1.0, 2.0);
                const speedVariation = Phaser.Math.FloatBetween(0.8, 1.2); // Speed variation
                const finalX = centerX + Math.cos(angle) * finalDistance;
                const finalY = centerY + Math.sin(angle) * finalDistance;
                
                // Animate each particle with proper physics-like motion
                this.scene.tweens.add({
                    targets: particle,
                    x: finalX,
                    y: finalY + (this.size * 0.3), // Add slight gravity effect
                    alpha: 0,
                    scale: Phaser.Math.FloatBetween(0.1, 0.4),
                    duration: Phaser.Math.Between(350, 700) * speedVariation,
                    ease: 'Cubic.easeOut',
                    onComplete: () => particle.destroy()
                });
            }
            
            // 4. Create more detailed mushroom fragments with better visuals
            const fragmentCount = 8; // Increased fragment count
            for (let i = 0; i < fragmentCount; i++) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = this.size * 0.3;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                // Create more varied fragment types
                let fragment;
                const fragmentType = i % 4;
                
                if (fragmentType === 0) {
                    // Cap fragment (triangular)
                    fragment = this.scene.add.triangle(
                        x, y,
                        0, 0,
                        this.size * 0.15, -this.size * 0.2,
                        this.size * 0.3, this.size * 0.05,
                        0xddcc99
                    );
                } else if (fragmentType === 1) {
                    // Cap fragment (circular)
                    fragment = this.scene.add.circle(x, y, this.size * 0.15, 0xccbb88);
                } else if (fragmentType === 2) {
                    // Stem fragment (rectangular)
                    fragment = this.scene.add.rectangle(x, y, this.size * 0.1, this.size * 0.2, 0xeeddcc);
                } else {
                    // Gill fragment (thin rectangle)
                    fragment = this.scene.add.rectangle(x, y, this.size * 0.25, this.size * 0.05, 0xbbaa88);
                }
                
                // Add subtle detail to the fragment
                let fragmentDetail;
                if (fragmentType === 0 || fragmentType === 1) {
                    // Detail for cap fragments
                    fragmentDetail = this.scene.add.circle(x, y, this.size * 0.05, 0xeeddbb);
                    fragmentDetail.setAlpha(0.5);
                    explosionElements.push(fragmentDetail);
                }
                
                // Set random rotation
                fragment.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
                explosionElements.push(fragment);
                
                // Animate the fragment flying outward with physics-like motion
                const finalDistance = this.size * Phaser.Math.FloatBetween(1.5, 2.5);
                const finalX = centerX + Math.cos(angle) * finalDistance;
                const finalY = centerY + Math.sin(angle) * finalDistance + (this.size * 0.4); // Add gravity
                const rotationSpeed = Phaser.Math.FloatBetween(-Math.PI * 2, Math.PI * 2);
                
                // Main fragment animation
                this.scene.tweens.add({
                    targets: fragment,
                    x: finalX,
                    y: finalY,
                    rotation: fragment.rotation + rotationSpeed,
                    alpha: 0,
                    duration: Phaser.Math.Between(500, 800),
                    ease: 'Cubic.easeOut',
                    onComplete: () => fragment.destroy()
                });
                
                // Animate detail with the fragment if it exists
                if (fragmentDetail) {
                    this.scene.tweens.add({
                        targets: fragmentDetail,
                        x: finalX,
                        y: finalY,
                        alpha: 0,
                        duration: Phaser.Math.Between(500, 800),
                        ease: 'Cubic.easeOut',
                        onComplete: () => fragmentDetail.destroy()
                    });
                }
            }
            
            // Add a final bright central flash for impact
            const finalFlash = this.scene.add.circle(centerX, centerY, this.size * 0.3, 0xffffff);
            finalFlash.setAlpha(1);
            explosionElements.push(finalFlash);
            
            this.scene.tweens.add({
                targets: finalFlash,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                ease: 'Cubic.easeOut',
                onComplete: () => finalFlash.destroy()
            });
            
            // Call the onComplete callback after a delay
            this.scene.time.delayedCall(50, () => {
                if (onComplete) {
                    onComplete();
                }
                
                // Destroy the tile after all animations finish
                this.scene.time.delayedCall(800, () => {
                    // Ensure all explosion elements are cleared
                    explosionElements.forEach(element => {
                        if (element && typeof element.destroy === 'function') {
                            element.destroy();
                        }
                    });
                    
                    // Finally destroy the tile
                    this.destroy();
                });
            });
            
        } catch (e) {
            console.error("Error animating explosion:", e);
            
            // Ultra simple fallback
            if (this.background) this.background.setVisible(false);
            if (onComplete) {
                onComplete();
            }
            this.scene.time.delayedCall(10, () => {
                this.destroy();
            });
        }
    }
    
    /**
     * Destroy the tile and its components
     */
    destroy() {
        try {
            // Stop any active tweens
            if (this.pulseTween) {
                this.pulseTween.stop();
                this.pulseTween = null;
            }
            
            // Destroy all visual components
            if (this.backgroundGroup) {
                this.backgroundGroup.forEach(item => {
                    if (item && typeof item.destroy === 'function') {
                        item.destroy();
                    }
                });
            }
            
            // Clear the container references
            if (this.container) {
                this.container.forEach(item => {
                    if (item && typeof item.destroy === 'function') {
                        item.destroy();
                    }
                });
            }
            
            // Clear arrays
            this.backgroundGroup = [];
            this.container = [];
        } catch (e) {
            console.error("Error destroying tile:", e);
        }
    }
}
