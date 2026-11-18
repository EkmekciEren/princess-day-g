import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { MUSIC, PAINTING, SITE } from './src/config.ts';

const publicFile = (name: string) => existsSync(fileURLToPath(new URL(`./public/${name}`, import.meta.url)));

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Fills {{SITE_*}} placeholders in index.html from src/config.ts. */
function siteMeta(): Plugin {
  const values: Record<string, string> = {
    SITE_TITLE: SITE.title,
    SITE_DESCRIPTION: SITE.description,
    SITE_THEME_COLOR: SITE.themeColor,
    SITE_URL: SITE.url,
    SITE_OG_IMAGE: new URL(SITE.ogImage, SITE.url).href,
  };
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/\{\{(SITE_[A-Z_]+)\}\}/g, (_, key: string) => escapeHtml(values[key] ?? '')),
    },
  };
}

export default defineConfig({
  // Relative base: the built site works from any GitHub Pages sub-path
  // (https://<user>.github.io/<repo>/) without hard-coding the repo name.
  base: './',
  // Optional assets are detected at build time, so a missing file never
  // causes a 404 in the browser console.
  define: {
    __HAS_PAINTING__: JSON.stringify(publicFile(PAINTING.file)),
    __HAS_MUSIC__: JSON.stringify(publicFile(MUSIC.file)),
  },
  plugins: [siteMeta()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
