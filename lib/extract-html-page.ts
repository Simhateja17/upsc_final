import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Reads a static HTML file from /public, strips the embedded <nav> element
 * and nav-related CSS (the old navbar), and adjusts the hero padding-top
 * that was added to offset the old fixed nav.
 */
export function extractHtmlPage(filename: string): { styles: string; body: string } {
  const htmlPath = resolve(process.cwd(), 'public', filename);
  const html = readFileSync(htmlPath, 'utf-8');

  // --- Styles ---
  const styleMatches = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
  let styles = styleMatches.map((m) => m[1]).join('\n');

  // Strip nav-specific CSS blocks (nav, .logo, .nav-links, .nl, .nav-cta, .mobile-*)
  styles = styles.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/\s*\n?\s*(nav|\.logo|\.logo-img|\.logo-badge|\.nav-links|\.nl|\.nav-cta(?:-outline)?|\.mobile-menu|\.mobile-nav)\s*\{[^}]*\}/g, '');
  styles = styles.replace(/(nav|\.logo|\.logo-img|\.logo-badge|\.nav-links|\.nl|\.nav-cta(?:-outline)?|\.mobile-menu|\.mobile-nav)\s*\{[^}]*\}/g, '');

  // Update hero padding-top from old nav height (64px) to match the landing nav height (66px)
  styles = styles.replace(/(\.legal-hero\s*\{[^}]*)padding-top\s*:\s*64px\s*;?/g, '$1padding-top:66px;');
  styles = styles.replace(/(\.hero\s*\{[^}]*)padding-top\s*:\s*64px\s*;?/g, '$1padding-top:66px;');

  // Add font import
  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');\n`;
  styles = fontImport + styles;

  // --- Body ---
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;

  // Strip the <nav>...</nav> element
  body = body.replace(/<!--\s*NAV\s*-->\s*/gi, '');
  body = body.replace(/<nav[\s\S]*?<\/nav>/i, '');

  return { styles, body };
}
