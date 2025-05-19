/**
 * Helper methods for Grid class to handle adjacency checking and grid operations
 */

// Add these methods to the Grid class prototype
Grid.prototype.isAdjacent = function(tile1, tile2) {
    // Skip if either tile is null
    if (!tile1 || !tile2) return false;
    
    const rowDiff = Math.abs(tile1.gridY - tile2.gridY);
    const colDiff = Math.abs(tile1.gridX - tile2.gridX);
    
    // Adjacent if not the same tile and both row/col diff <= 1
    return (tile1 !== tile2) && (rowDiff <= 1 && colDiff <= 1);
};
