const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001; // Changed from 3000 to 3001
const baseDir = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.txt': 'text/plain',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon'
};

const server = http.createServer((request, response) => {
    console.log(`Request URL: ${request.url}`);
    
    // Normalize URL to prevent directory traversal
    let filePath = path.normalize(path.join(baseDir, request.url));
    
    // Default to index.html for root path
    if (request.url === '/') {
        filePath = path.join(baseDir, 'index.html');
    }
    
    // Get the file extension
    const extname = path.extname(filePath);
    
    // Set the content type based on the file extension
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read the file and serve it
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                response.writeHead(404);
                response.end('File not found');
            } else {
                // Server error
                response.writeHead(500);
                response.end(`Server Error: ${error.code}`);
            }
        } else {
            // Successful response
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`Serving files from ${baseDir}`);
});
