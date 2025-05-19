/**
 * Validates words against a dictionary
 */
class WordValidator {
    constructor() {
        this.dictionary = new Set();
        this.loaded = false;
        this.loading = false;
        
        // Load the dictionary when the class is instantiated
        this.loadDictionary();
    }
    
    /**
     * Load the dictionary file
     */
    loadDictionary() {
        if (this.loading || this.loaded) {
            return;
        }
        
        this.loading = true;
        console.log('Loading dictionary...');
        
        // Use fetch with error handling for CORS
        this.fetchDictionaryWithFallback();
    }
    
    /**
     * Fetch dictionary with fallback options for CORS issues
     */
    fetchDictionaryWithFallback() {
        fetch('dict.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                this.processDictionary(text);
            })
            .catch(error => {
                console.error('Error loading dictionary:', error);
                
                // Try with a different approach if it might be a CORS issue
                if (window.location.protocol === 'file:') {
                    console.warn('Running from file:// protocol. CORS issues expected. Using fallback dictionary.');
                    this.createFallbackDictionary();
                } else {
                    // Show a more helpful message about needing to use a server
                    console.warn('Could not load dictionary file. Try running the game using the server.js script.');
                    this.createFallbackDictionary();
                }
            });
    }
    
    /**
     * Process the dictionary text data
     */
    processDictionary(text) {
        // Clear the dictionary before adding new words
        this.dictionary.clear();
        
        // Split the text by newlines and add each word to the dictionary
        const words = text.split(/\r?\n/);
        
        // Create dictionary with all words
        let count = 0;
        words.forEach(word => {
            const trimmedWord = word.trim();
            if (trimmedWord.length > 0) {
                this.dictionary.add(trimmedWord.toUpperCase());
                count++;
            }
        });
        
        this.loaded = true;
        this.loading = false;
        console.log(`Dictionary loaded with ${this.dictionary.size} words (${count} added)`);
        
        // Test with some common words to verify it's working
        const testWords = ['THE', 'AND', 'CAT', 'DOG', 'HELLO', 'WORLD'];
        testWords.forEach(word => {
            console.log(`Test word "${word}" is ${this.dictionary.has(word) ? 'in' : 'NOT in'} dictionary`);
        });
    }
    
    /**
     * Create a fallback dictionary with common words
     * This is used if the dictionary file fails to load
     */
    createFallbackDictionary() {
        console.log('Creating fallback dictionary');
        
        // Clear the dictionary before adding fallback words
        this.dictionary.clear();
        
        const commonWords = [
            'THE', 'AND', 'THAT', 'HAVE', 'FOR', 'NOT', 'WITH', 'YOU', 'THIS', 'BUT',
            'HIS', 'FROM', 'THEY', 'SAY', 'SHE', 'WILL', 'ONE', 'ALL', 'WOULD', 'THERE',
            'THEIR', 'WHAT', 'OUT', 'ABOUT', 'WHO', 'GET', 'WHICH', 'WHEN', 'MAKE', 'CAN',
            'LIKE', 'TIME', 'JUST', 'HIM', 'KNOW', 'TAKE', 'PEOPLE', 'INTO', 'YEAR', 'YOUR',
            'GOOD', 'SOME', 'COULD', 'THEM', 'SEE', 'OTHER', 'THAN', 'THEN', 'NOW', 'LOOK',
            'ONLY', 'COME', 'ITS', 'OVER', 'THINK', 'ALSO', 'BACK', 'AFTER', 'USE', 'TWO',
            'HOW', 'OUR', 'WORK', 'FIRST', 'WELL', 'WAY', 'EVEN', 'NEW', 'WANT', 'BECAUSE',
            'ANY', 'THESE', 'GIVE', 'DAY', 'MOST', 'CAT', 'DOG', 'MAN', 'CAR', 'TREE',
            'BIRD', 'GAME', 'FOOD', 'LOVE', 'AIR', 'SUN', 'MOON', 'WATER', 'BOOK', 'STAR'
        ];
        
        commonWords.forEach(word => {
            this.dictionary.add(word);
        });
        
        this.loaded = true;
        console.log(`Fallback dictionary created with ${this.dictionary.size} words`);
    }
    
    /**
     * Check if a word is valid
     * @param {string} word - The word to check
     * @returns {boolean} True if the word is valid
     */
    isValid(word) {
        // Minimum length requirement
        if (word.length < 3) {
            return false;
        }
        
        // Skip logging for better performance during active gameplay
        if (word.length >= 6) {
            console.log(`Checking word: "${word}"`);
        }
        
        // If dictionary is not loaded yet, wait a bit more
        if (!this.loaded) {
            if (this.loading) {
                if (word.length >= 6) console.warn('Dictionary still loading, temporarily rejecting all words');
                return false;
            } else {
                if (word.length >= 6) console.warn('Dictionary failed to load, using fallback dictionary');
                this.createFallbackDictionary();
            }
        }
        
        // Check if the word is in the dictionary
        const upperWord = word.toUpperCase();
        const result = this.dictionary.has(upperWord);
        
        // Only log for longer words to reduce console spam
        if (word.length >= 6) {
            console.log(`Word "${word}" (${upperWord}) is ${result ? 'valid' : 'invalid'}`);
            console.log(`Dictionary size: ${this.dictionary.size}, contains 'THE': ${this.dictionary.has('THE')}`);
        }
        
        return result;
    }
    
    /**
     * Get the word from an array of tiles
     * @param {Tile[]} tiles - Array of selected tiles
     * @returns {string} The formed word
     */
    getWordFromTiles(tiles) {
        if (!tiles || !Array.isArray(tiles)) {
            return '';
        }
        
        try {
            return tiles.map(tile => tile ? tile.letter : '').join('');
        } catch (error) {
            console.error('Error getting word from tiles:', error);
            return '';
        }
    }
}
