import { serve } from "bun";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Default to index.html for root
    if (path === '/') {
      path = '/index.html';
    }
    
    // Remove leading slash and serve from dist
    const filePath = join('./dist', path.slice(1));
    
    try {
      const file = await readFile(filePath);
      
      // Set content type based on file extension
      const ext = extname(filePath);
      const contentType = ext === '.html' ? 'text/html' : 
                         ext === '.css' ? 'text/css' :
                         ext === '.js' ? 'application/javascript' :
                         'text/plain';
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
        },
      });
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log(`🌐 Preview server running at http://localhost:${server.port}`);
console.log(`📁 Serving files from ./dist/`);
console.log(`🔥 Press Ctrl+C to stop`); 