# Spores

Spores is a hybrid web-based puzzle game combining mechanics from word games and match-3 games. Players form words on an 8x8 letter grid. Creating valid words causes those letters to explode and release "spores" that attach to other letters. Accumulation of spores causes further explosions, creating chain reactions and earning bonuses.

## How to Play

1. Connect adjacent letters (including diagonals) to form words of 3 or more letters.
2. Words must be valid English words from the dictionary. Dictionary verification is fully implemented and working.
3. When a valid word is created, the letters explode and release spores.
4. Spores land on other tiles, which can trigger chain reactions when they reach a threshold.
5. Score points based on letter values, word length, and cascade bonuses.

## Game Parameters
- **Spore Count**: Each exploded tile releases spores (number based on word length)
- **Spore Threshold**: When a tile's spore count reaches the threshold (default: 5), it explodes
- **Distribution Range**: Controls how spores are distributed to nearby tiles

## Running the Game

### Important: Use the HTTP Server

Due to browser security restrictions, you need to run this game using the included HTTP server:

1. Make sure you have Node.js installed.
2. Open a terminal/command prompt.
3. Navigate to the game directory.
4. Run the start script:

   ```
   ./start.sh
   ```
   
   Or manually:
   
   ```
   node server.js
   ```

5. Open your browser and go to http://localhost:3001

**Note:** Opening the index.html file directly in your browser will cause CORS issues that prevent loading the dictionary and other resources.

## Scoring

- Basic points from the Scrabble value of each letter.
- Long word bonus for words with 6+ letters.
- Cascade bonus for chain reactions.
- Spore overload bonus for triggering 3+ tiles in one cascade.

## Features

- 8x8 grid of letters based on UK English Scrabble distribution
- Word validation using English dictionary
- Spore system with cascading explosions
- Scoring system with bonuses
- Responsive design

## Credits

Developed as part of the Magnetic project.
