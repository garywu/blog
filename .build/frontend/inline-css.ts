import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

async function generateTailwindCSS(): Promise<string> {
  // Generate minimal Tailwind CSS for the classes we're using
  const css = `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-white { background-color: #ffffff; }
    .min-h-screen { min-height: 100vh; }
    .max-w-4xl { max-width: 56rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-16 { margin-top: 4rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .w-12 { width: 3rem; }
    .h-12 { height: 3rem; }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .w-8 { width: 2rem; }
    .h-8 { height: 2rem; }
    .w-7 { width: 1.75rem; }
    .h-7 { height: 1.75rem; }
    .w-6 { width: 1.5rem; }
    .h-6 { height: 1.5rem; }
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }
    .p-1 { padding: 0.25rem; }
    .rounded-full { border-radius: 9999px; }
    .mr-8 { margin-right: 2rem; }
    .mr-6 { margin-right: 1.5rem; }
    .mr-4 { margin-right: 1rem; }
    .mr-3 { margin-right: 0.75rem; }
    .mr-2 { margin-right: 0.5rem; }
    .mr-1 { margin-right: 0.25rem; }
    .ml-4 { margin-left: 1rem; }
    .bg-gray-200 { background-color: #e5e7eb; }
    .justify-center { justify-content: center; }
    .mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
    .inline-block { display: inline-block; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-normal { font-weight: 400; }
    .font-light { font-weight: 300; }
    .text-gray-900 { color: #111827; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-500 { color: #6b7280; }
    .text-blue-600 { color: #2563eb; }
    .text-blue-800 { color: #1e40af; }
    .border { border-width: 1px; }
    .border-gray-200 { border-color: #e5e7eb; }
    .rounded-lg { border-radius: 0.5rem; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .text-center { text-align: center; }
    .transition-shadow { transition-property: box-shadow; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .hover\\:shadow-md:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .hover\\:text-blue-800:hover { color: #1e40af; }
    a { text-decoration: none; }
    .prose { max-width: 65ch; }
    .prose-lg { font-size: 1.125rem; line-height: 1.8; }
    .prose h1 { font-size: 2.25rem; font-weight: 800; margin-top: 0; margin-bottom: 0.8888889em; }
    .prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2em; margin-bottom: 1em; }
    .prose h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.6em; margin-bottom: 0.6em; }
    .prose p { margin-top: 1.25em; margin-bottom: 1.25em; }
    .prose li { margin-top: 0.5em; margin-bottom: 0.5em; }
    .prose code { color: #ef4444; background-color: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875em; }
    .prose pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    .prose pre code { background-color: transparent; color: inherit; padding: 0; }
    .max-w-none { max-width: none; }
    .text-2xl { font-size:1.5rem; line-height:2rem; }
    .pb-4 { padding-bottom:1rem; }
    .border-b { border-bottom-width:1px; }
    .focus\:outline-none:focus { outline: none; }
    .w-full { width:100%; }
    .max-w-2xl { max-width:42rem; }
  `.replace(/\s+/g, ' ').trim();
  
  return css;
}

async function inlineCSS() {
  console.log('🎨 Inlining CSS...');
  
  let css: string;
  try {
    css = await readFile('dist/tailwind.css', 'utf-8');
    console.log('✅ Loaded generated Tailwind CSS');
  } catch {
    console.log('⚠️  dist/tailwind.css not found, falling back to minimal CSS');
    css = await generateTailwindCSS();
  }
  const files = await readdir('dist');
  const htmlFiles = files.filter(file => file.endsWith('.html'));
  
  for (const file of htmlFiles) {
    const htmlPath = join('dist', file);
    let html = await readFile(htmlPath, 'utf-8');
    
    // Replace the placeholder style tag with actual CSS
    html = html.replace(
      '<style>\n    /* Tailwind will be inlined here by the build process */\n  </style>',
      `<style>${css}</style>`
    );
    
    await writeFile(htmlPath, html);
    console.log(`✅ Inlined CSS for ${file}`);
  }
  
  console.log('🎉 CSS inlining complete!');
}

inlineCSS().catch(console.error); 