import { marked } from 'marked';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

interface BlogPost {
  title: string;
  description: string;
  date: Date;
  slug: string;
  content: string;
  sourceFile: string;
}

async function extractFrontmatter(content: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match && match[1] && match[2]) {
    const frontmatter = match[1];
    const body = match[2];
    
    // Parse simple frontmatter
    const metadata: any = {};
    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return { metadata, content: body };
  }
  
  return { metadata: {}, content };
}

async function readMarkdownFiles(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  const blogDirs = ['git-publish', 'bootstrapping-setup', 'w-slash-ai'];
  
  for (const dir of blogDirs) {
    try {
      const readmePath = join('..', dir, 'README.md');
      const content = await readFile(readmePath, 'utf-8');
      const { metadata, content: markdownContent } = await extractFrontmatter(content);
      
      // Extract title from markdown content if not in frontmatter
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      const title = metadata.title || (titleMatch ? titleMatch[1] : dir);
      
      // Create description from content, skipping attribution and getting actual description
      let description = metadata.description;
      
      if (!description) {
        // Remove the w/ai attribution line and look for actual descriptive content
        const cleanContent = markdownContent
          .replace(/\*\[w\/ai\]\(\.\/ai\/README\.md\)\*/g, '') // Remove w/ai attribution
          .replace(/^---[\s\S]*?---\n/g, ''); // Remove any frontmatter
        
                 // Look for content after the main title but before the first heading
         const splitContent = cleanContent.split(/^#[^#]/m);
         const afterTitle = splitContent.length > 1 ? splitContent[1] : null;
         if (afterTitle) {
           // Find the first substantial paragraph (not just a single line)
           const paragraphs = afterTitle.split(/\n\s*\n/).filter(p => 
             p.trim().length > 50 && 
             !p.trim().startsWith('#') && 
             !p.trim().startsWith('*') &&
             !p.trim().startsWith('-') &&
             !p.trim().startsWith('1.')
           );
           
           if (paragraphs.length > 0 && paragraphs[0]) {
             const firstParagraph = paragraphs[0].trim()
               .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
               .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
               .replace(/\*([^*]+)\*/g, '$1') // Remove italic formatting
               .replace(/`([^`]+)`/g, '$1'); // Remove code formatting
             description = firstParagraph.substring(0, 200) + (firstParagraph.length > 200 ? '...' : '');
           }
         }
        
        // Fallback to a simple approach if above doesn't work
        if (!description) {
          const simpleMatch = cleanContent.match(/\n\n([^#\n]{50,})/);
          description = simpleMatch?.[1]?.trim().substring(0, 150) + '...' || 'Comprehensive guide with practical examples and best practices.';
        }
      }
      
      // Use current date if no date specified
      const date = metadata.date ? new Date(metadata.date) : new Date();
      
      const slug = dir;
      const htmlContent = await marked(markdownContent);
      
      posts.push({
        title,
        description,
        date,
        slug,
        content: htmlContent,
        sourceFile: readmePath
      });
    } catch (error) {
      console.log(`Skipping ${dir}: ${error}`);
    }
  }
  
  // Sort by date (newest first)
  posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return posts;
}

function generateHomepage(posts: BlogPost[]): string {
  const postCards = posts.map(post => `
    <article class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <h2 class="text-xl font-semibold mb-2">
        <a href="${post.slug}.html" class="text-blue-600 hover:text-blue-800">${post.title}</a>
      </h2>
      <p class="text-gray-600 mb-3">${post.description}</p>
      <time class="text-sm text-gray-500">${post.date.toLocaleDateString()}</time>
    </article>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Workflows & AI-Assisted Content</title>
  <style>
    /* Tailwind will be inlined here by the build process */
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Developer Workflows & AI-Assisted Content</h1>
      <p class="text-xl text-gray-600">Comprehensive guides on developer tools, modern development environments, and AI-first content creation</p>
    </header>
    
    <main class="space-y-6">
      ${postCards}
    </main>
    
    <footer class="mt-16 text-center text-gray-500 text-sm">
      <p>Built with transparency: Human creativity + AI assistance</p>
    </footer>
  </div>
</body>
</html>`;
}

function generatePostPage(post: BlogPost): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <style>
    /* Tailwind will be inlined here by the build process */
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <nav class="mb-8">
      <a href="index.html" class="text-blue-600 hover:text-blue-800">&larr; Back to Blog</a>
    </nav>
    
    <article class="bg-white rounded-lg p-8 shadow-sm">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${post.title}</h1>
        <time class="text-gray-500">${post.date.toLocaleDateString()}</time>
      </header>
      
      <div class="prose prose-lg max-w-none">
        ${post.content}
      </div>
    </article>
  </div>
</body>
</html>`;
}

async function build() {
  console.log('🔄 Reading markdown files...');
  const posts = await readMarkdownFiles();
  
  console.log(`📝 Found ${posts.length} posts`);
  posts.forEach(post => console.log(`  - ${post.title}`));
  
  console.log('🏗️  Generating HTML...');
  
  // Ensure dist directory exists
  await mkdir('dist', { recursive: true });
  
  // Generate homepage
  const homepage = generateHomepage(posts);
  await writeFile('dist/index.html', homepage);
  
  // Generate individual post pages
  for (const post of posts) {
    const postHtml = generatePostPage(post);
    await writeFile(`dist/${post.slug}.html`, postHtml);
  }
  
  console.log('🎨 Inlining CSS...');
  
  // Run CSS inlining
  const { spawn } = await import('child_process');
  await new Promise((resolve, reject) => {
    const inlineProcess = spawn('bun', ['inline-css.ts'], { stdio: 'inherit' });
    inlineProcess.on('close', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`CSS inlining failed with code ${code}`));
    });
  });
  
  console.log('✅ Build complete! Single-file HTML generated in dist/');
}

// Run the build
build().catch(console.error); 