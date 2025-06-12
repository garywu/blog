import { serve } from "bun";
import { readFile, watch } from "fs/promises";
import { join, extname } from "path";
import { spawn } from "child_process";

let isBuilding = false;
let lastBuildTime = 0;

async function triggerBuild() {
  if (isBuilding) {
    console.log('🔄 Build already in progress, skipping...');
    return;
  }
  
  const now = Date.now();
  if (now - lastBuildTime < 1000) {
    console.log('🔄 Debouncing build...');
    return;
  }
  
  isBuilding = true;
  lastBuildTime = now;
  
  console.log('🔄 File changes detected, rebuilding...');
  
  try {
    await new Promise((resolve, reject) => {
      const buildProcess = spawn('bun', ['build.ts'], { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build complete!');
          resolve(undefined);
        } else {
          console.error(`❌ Build failed with code ${code}`);
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('❌ Build error:', error);
  } finally {
    isBuilding = false;
  }
}

// Watch for file changes
async function startWatcher() {
  const watchPaths = [
    '../site.yaml',
    '../git-publish/README.md',
    '../bootstrapping-setup/README.md', 
    '../w-slash-ai/README.md',
    './tailwind.config.js',
    './build.ts'
  ];
  
  console.log('👁️  Watching for changes in:');
  watchPaths.forEach(path => console.log(`   - ${path}`));
  
  for (const watchPath of watchPaths) {
    try {
      const watcher = watch(watchPath);
      (async () => {
        for await (const event of watcher) {
          if (event.eventType === 'change') {
            console.log(`📝 Changed: ${watchPath}`);
            await triggerBuild();
          }
        }
      })().catch(console.error);
    } catch (error) {
      console.log(`⚠️  Could not watch ${watchPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  },
});

// Start file watcher
startWatcher();

console.log(`🌐 Preview server running at http://localhost:${server.port}`);
console.log(`📁 Serving files from ./dist/`);
console.log(`🔥 Hot-reload enabled - changes will trigger rebuilds`);
console.log(`🛑 Press Ctrl+C to stop`); 