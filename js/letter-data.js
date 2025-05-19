/**
 * Scrabble letter data for UK English version
 * Contains letter distributions and point values
 */
const LetterData = {
    // Letter distribution (how many of each letter should be in the pool)
    distribution: {
        'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2, 'I': 9,
        'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2, 'Q': 1, 'R': 6,
        'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1, 'Y': 2, 'Z': 1
    },
    
    // Point values for each letter
    points: {
        'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
        'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
        'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
    },
    
    /**
     * Generate a random letter based on Scrabble distribution
     * @returns {string} A single uppercase letter
     */
    getRandomLetter: function() {
        // Create an array with letters repeated according to their distribution
        const letterPool = [];
        for (const [letter, count] of Object.entries(this.distribution)) {
            for (let i = 0; i < count; i++) {
                letterPool.push(letter);
            }
        }
        
        // Pick a random letter from the pool
        const randomIndex = Math.floor(Math.random() * letterPool.length);
        return letterPool[randomIndex];
    },
    
    /**
     * Get the point value for a letter
     * @param {string} letter - A single uppercase letter
     * @returns {number} The point value
     */
    getPointValue: function(letter) {
        return this.points[letter] || 0;
    }
};
