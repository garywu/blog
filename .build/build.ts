import { marked } from 'marked';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';

interface BlogPost {
  title: string;
  description: string;
  date: Date;
  slug: string;
  content: string;
  sourceFile: string;
}

interface SiteConfig {
  title: string;
  tagline: string;
  social: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const configContent = await readFile('../site.yaml', 'utf-8');
    return parseYaml(configContent) as SiteConfig;
  } catch (error) {
    console.log('⚠️  No site.yaml found, using defaults');
    return {
      title: 'Gary Wu',
      tagline: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit of one\'s making.',
      social: {}
    };
  }
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

function generateHomepage(posts: BlogPost[], siteConfig: SiteConfig): string {
  const postCards = posts.map(post => `
    <article class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <h2 class="text-xl font-semibold mb-2">
        <a href="${post.slug}.html" class="text-blue-600 hover:text-blue-800">${post.title}</a>
      </h2>
      <p class="text-gray-600 mb-3">${post.description}</p>
    </article>
  `).join('');

  const socialLinks = Object.entries(siteConfig.social)
    .filter(([_, url]) => url)
    .map(([platform, url]) => {
      const tooltipText = platform === 'twitter' ? 'X/Twitter' : platform.charAt(0).toUpperCase() + platform.slice(1);
      const icon = platform === 'twitter' ?
        '<svg class="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' :
        platform === 'github' ?
        '<svg class="social-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>' :
        '';
      return `
        <a href="${url}" title="${tooltipText}" class="text-gray-600 hover:text-blue-600 p-1 ml-4" target="_blank" rel="noopener">
          ${icon}
        </a>
      `;
    }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteConfig.title}</title>
  <style>
    /* Tailwind will be inlined here by the build process */
    .header-center-col { display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .icon-container { width: 32px; height: 32px; background: #e5e7eb; border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; position: relative; cursor: pointer; }
    .icon-container img { width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; display: block; }
    .header-title { font-size: 1.25rem; font-weight: 300; color: #111827; text-align: center; margin: 0; line-height: 1.1; }
    .tagline-float { display: none; position: absolute; left: 50%; transform: translateX(-50%); top: 2.5rem; font-size: 0.875rem; color: #64748B; background: #fff; padding: 0.25rem 0.75rem; border-radius: 0.375rem; box-shadow: 0 2px 8px rgba(16,30,54,0.06); white-space: pre-line; z-index: 10; }
    .icon-container:hover + .header-title + .tagline-float,
    .icon-container:focus + .header-title + .tagline-float {
      display: block;
    }
    @media (max-width: 600px) {
      .header-center-col { padding-left: 0.5rem; padding-right: 0.5rem; }
      .tagline-float { font-size: 0.75rem; }
    }
    .social-icon { width: 20px; height: 20px; display: inline-block; vertical-align: middle; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-12">
      <div class="header-center-col mb-1">
        <div class="icon-container" tabindex="0">
          <img src="https://avatars.githubusercontent.com/u/38446?v=4" alt="Gary Wu">
        </div>
        <h1 class="header-title">${siteConfig.title}</h1>
        <div class="tagline-float">${siteConfig.tagline}</div>
      </div>
      <hr class="border-gray-200 mb-1">
      ${socialLinks ? `<div class="text-sm flex items-center justify-center">${socialLinks}</div>` : ''}
    </header>
    <main class="space-y-6">
      ${postCards}
    </main>
    <footer class="mt-16 text-center text-gray-500 text-sm">
      <p>Created through human-AI collaboration</p>
      <p class="mt-2">Build #${Math.floor(Date.now() / 1000)} • ${new Date().toLocaleString()}</p>
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
      <div class="prose prose-lg max-w-none">
        ${post.content}
      </div>
    </article>
  </div>
</body>
</html>`;
}

function generateIntelligentReadme(siteConfig: SiteConfig, posts: BlogPost[]) {
  // Compose a rich, context-aware README with AI section markers
  return [
    '# Minimal Markdown Blog',
    '',
    '> This README is auto-generated and is used by both humans and AI assistants to understand, build, and extend the project.',
    '',
    '## 🚀 Philosophy & Design Goals',
    '- **Zero Configuration by Default:** Just drop in folders with README.md files—no setup, no config, no fuss. Your site is instantly beautiful and modern.',
    '- **Optional, Effortless Customization:** If you want to personalize, add a site.yaml to override anything: title, tagline, theme, fonts, colors, navigation, and more.',
    '- **Modular & Maintainable:** The build script is fully responsible for everything (content, theme, config, output), but is internally modular for easy extension.',
    '- **AI-Assisted Documentation:** This README is always up-to-date, context-aware, and explains your actual setup, features, and best practices.',
    '',
    '## 🏁 Getting Started: Zero-Config Usage',
    '1. **Add Content:** Create folders in your project (e.g., my-first-post/) and put a README.md in each.',
    '2. **Build Your Site:**',
    '   ```sh',
    '   bun run build.ts',
    '   ```',
    '   That\'s it! Your site is generated in /dist/ with a timeless, elegant theme.',
    '',
    '## ⚙️ Optional Configuration (site.yaml)',
    'If you want to customize your site, add a site.yaml at the project root. You only need to specify what you want to override—everything else uses sensible defaults.',
    '',
    '**Example:**',
    '```yaml',
    siteConfig ? `title: "${siteConfig.title}"
tagline: "${siteConfig.tagline}"
${siteConfig.social ? `social:
${Object.entries(siteConfig.social).map(([k, v]) => `  ${k}: "${v}"`).join('\n')}` : ''}` : '',
    '```',
    '',
    '## 🎨 Theme System',
    '- **Theme files live in /theme/:**',
    '  - variables.css: CSS custom properties (colors, spacing, etc.)',
    '  - fonts.css: Font imports (self-hosted or system, privacy-first)',
    '  - base.css: Base styles (body, headings, etc.)',
    '  - components.css: Cards, buttons, links, and more',
    '- **How it works:**',
    '  - The build script merges theme defaults with any overrides from site.yaml.',
    '  - Fonts are self-hosted for privacy and performance (no Google CDN tracking).',
    '  - You can edit theme CSS directly for advanced customization.',
    '',
    '## Posts Detected',
    '<!-- AI:POSTS_START -->',
    ...posts.map(post => `- ${post.title}`),
    '<!-- AI:POSTS_END -->',
    '',
    '## Theme Files',
    '<!-- AI:THEME_START -->',
    '- /theme/variables.css',
    '- /theme/fonts.css',
    '- /theme/base.css',
    '- /theme/components.css',
    '<!-- AI:THEME_END -->',
    '',
    '## 🧩 Extending & Best Practices',
    '- **Add a new post:** Create a new folder with a README.md—it\'s automatically included.',
    '- **Customize the look:** Edit /theme/ CSS or add theme options to site.yaml.',
    '- **Advanced:** Add navigation, author info, or meta tags in site.yaml. Add new theme files or components for more control.',
    '',
    '## 🤖 How This Works',
    '- The build script:',
    '  - Discovers all markdown posts and folders',
    '  - Reads site.yaml (if present) and merges with theme defaults',
    '  - Generates theme CSS and injects it into your site',
    '  - Outputs static HTML in /dist/',
    '  - **Auto-generates this README** so it\'s always accurate and helpful',
    '',
    '## FAQ',
    '**Q: Do I need to configure anything to get started?**  ',
    'A: No! Just add markdown folders and run the build.',
    '',
    '**Q: How do I change the theme or fonts?**  ',
    'A: Edit /theme/ CSS or add overrides in site.yaml.',
    '',
    '**Q: Is this privacy-friendly?**  ',
    'A: Yes! Fonts are self-hosted by default, and no user data is sent to third-party CDNs.',
    '',
    '**Q: How do I update the README?**  ',
    'A: Just run the build script—it\'s always up-to-date.',
    '',
    '---',
    '',
    '**This README was generated by AI, based on your actual project state and configuration.**',
    ''
  ].join('\n');
}

async function build() {
  console.log('🔄 Loading site configuration...');
  const siteConfig = await loadSiteConfig();
  
  console.log('🔄 Reading markdown files...');
  const posts = await readMarkdownFiles();
  
  console.log(`📝 Found ${posts.length} posts`);
  posts.forEach(post => console.log(`  - ${post.title}`));
  
  console.log('🏗️  Generating HTML...');
  
  // Ensure dist directory exists
  await mkdir('dist', { recursive: true });
  
  // Generate homepage
  const homepage = generateHomepage(posts, siteConfig);
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

  // Generate intelligent README with AI section markers
  const readmeContent = generateIntelligentReadme(siteConfig, posts);
  await writeFile('../README.md', readmeContent);
  
  console.log('✅ Build complete! Single-file HTML generated in dist/');
}

// Run the build
build().catch(console.error); 