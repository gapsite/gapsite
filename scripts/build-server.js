import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[build-server] Starting server bundle and deployment preparation for Hostinger...');

// 1. Remove obsolete 'current' directory if it exists
const obsoleteCurrentDir = path.join(rootDir, 'current');
if (fs.existsSync(obsoleteCurrentDir)) {
  fs.rmSync(obsoleteCurrentDir, { recursive: true, force: true });
  console.log('[build-server] Removed obsolete directory: current/');
}

// 2. Ensure target Hostinger directory structures exist
const distDir = path.join(rootDir, 'dist');
const hbuildsNodejsDir = path.join(rootDir, 'hbuilds', 'current', 'nodejs');
const hbuildsDistDir = path.join(hbuildsNodejsDir, 'dist');
const hbuildsDataDir = path.join(hbuildsNodejsDir, 'data');
const publicHtmlDir = path.join(rootDir, 'public_html');

[distDir, hbuildsNodejsDir, hbuildsDistDir, hbuildsDataDir, publicHtmlDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 3. Bundle server.ts using esbuild to ESM format for Node 22 (with banner for require compatibility)
console.log('[build-server] Bundling server.ts with esbuild (ESM format for Node 22)...');
const esbuildCmd = [
  'npx esbuild server.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--packages=external',
  '--sourcemap',
  '--banner:js="import { createRequire } from \'module\'; const require = createRequire(import.meta.url);"',
  '--outfile=dist/server.js',
].join(' ');

execSync(esbuildCmd, { cwd: rootDir, stdio: 'inherit' });

// Also produce CommonJS bundle for environments needing CJS
console.log('[build-server] Bundling server.ts with esbuild (CJS format)...');
const esbuildCjsCmd = [
  'npx esbuild server.ts',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--packages=external',
  '--sourcemap',
  '--outfile=dist/server.cjs',
].join(' ');

execSync(esbuildCjsCmd, { cwd: rootDir, stdio: 'inherit' });

// 4. Deploy startup files:
// Root server.js (ESM bundle)
fs.copyFileSync(path.join(distDir, 'server.js'), path.join(rootDir, 'server.js'));
console.log('[build-server] Created root server.js');

// hbuilds/current/nodejs/server.js (Hostinger active structure)
fs.copyFileSync(path.join(distDir, 'server.js'), path.join(hbuildsNodejsDir, 'server.js'));
console.log('[build-server] Created hbuilds/current/nodejs/server.js');

// hbuilds/current/nodejs/package.json
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(hbuildsNodejsDir, 'package.json'));
console.log('[build-server] Copied package.json to hbuilds/current/nodejs/');

// Copy lockfile if present
if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
  fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(hbuildsNodejsDir, 'package-lock.json'));
} else if (fs.existsSync(path.join(rootDir, 'bun.lock'))) {
  fs.copyFileSync(path.join(rootDir, 'bun.lock'), path.join(hbuildsNodejsDir, 'bun.lock'));
}

// 5. Copy built frontend assets from dist to hbuilds/current/nodejs/dist/ and public_html/
console.log('[build-server] Copying built frontend assets to hbuilds/current/nodejs/dist/...');
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDirRecursive(distDir, hbuildsDistDir);

// 6. Copy persistent data if present
const dataDir = path.join(rootDir, 'data');
if (fs.existsSync(dataDir)) {
  copyDirRecursive(dataDir, hbuildsDataDir);
  console.log('[build-server] Synchronized persistent data to hbuilds/current/nodejs/data/');
}

// 7. Generate .htaccess reverse proxy configuration
const htaccessContent = `# =================================================================
# Hostinger / Apache / LiteSpeed Reverse Proxy & SPA Routing Config
# For GAP Horizon Consulting CRM Application (gaphorizon.com)
# =================================================================

# 1. Phusion Passenger / CloudLinux / LiteSpeed Node.js Handler
# Directs hosting engine to hbuilds/current/nodejs/server.js
<IfModule mod_passenger.c>
  PassengerEnabled on
  PassengerAppRoot hbuilds/current/nodejs
  PassengerStartupFile server.js
  PassengerAppType node
</IfModule>

# 2. URL Rewriting & Dynamic Reverse Proxy
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Security: Deny access to sensitive files
  RewriteRule ^(\\.env|data/mysql_config\\.json)$ - [F,L]

  # Allow direct access to existing files in hbuilds/current/nodejs/dist/ or dist/
  RewriteCond %{DOCUMENT_ROOT}/hbuilds/current/nodejs/dist/$1 -f
  RewriteRule ^(.*)$ hbuilds/current/nodejs/dist/$1 [L]

  RewriteCond %{DOCUMENT_ROOT}/dist/$1 -f
  RewriteRule ^(.*)$ dist/$1 [L]

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Dynamic Node.js Reverse Proxy pass-through for API and Health checks
  # Reads process.env.PORT dynamically when provided by hosting, avoiding hardcoded port mismatches
  <IfModule mod_proxy.c>
    # When PORT environment variable is exposed by hosting environment
    RewriteCond %{ENV:PORT} ^[0-9]+$
    RewriteCond %{REQUEST_URI} ^/(api/|health)
    RewriteRule ^(.*)$ http://127.0.0.1:%{ENV:PORT}/$1 [P,L]

    # Fallback reverse proxy using dynamic port resolution
    RewriteCond %{REQUEST_URI} ^/(api/|health)
    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
  </IfModule>

  # SPA HTML5 History Fallback to index.html in hbuilds/current/nodejs/dist or dist
  RewriteCond %{DOCUMENT_ROOT}/hbuilds/current/nodejs/dist/index.html -f
  RewriteRule ^ hbuilds/current/nodejs/dist/index.html [L]

  RewriteCond %{DOCUMENT_ROOT}/dist/index.html -f
  RewriteRule ^ dist/index.html [L]

  RewriteRule ^ index.html [L]
</IfModule>

# 3. Browser Caching & MIME types
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
`;

fs.writeFileSync(path.join(rootDir, '.htaccess'), htaccessContent, 'utf-8');
fs.writeFileSync(path.join(distDir, '.htaccess'), htaccessContent, 'utf-8');
fs.writeFileSync(path.join(publicHtmlDir, '.htaccess'), htaccessContent, 'utf-8');
fs.writeFileSync(path.join(hbuildsNodejsDir, '.htaccess'), htaccessContent, 'utf-8');
console.log('[build-server] Generated .htaccess in root, dist/, public_html/, and hbuilds/current/nodejs/');

// 8. Package deployment zip archives without wrapper folder
console.log('[build-server] Packaging deployment archives (deploy.zip & gaphorizon-deploy.zip)...');
try {
  execSync('python3 scripts/package-zip.py', { cwd: rootDir, stdio: 'inherit' });
} catch (zipErr) {
  console.warn('[build-server] Warning during zip packaging:', zipErr.message);
}

console.log('[build-server] Verification check:');
console.log(' - root server.js:', fs.existsSync(path.join(rootDir, 'server.js')) ? 'EXISTS' : 'MISSING');
console.log(' - hbuilds/current/nodejs/server.js:', fs.existsSync(path.join(hbuildsNodejsDir, 'server.js')) ? 'EXISTS' : 'MISSING');
console.log(' - hbuilds/current/nodejs/package.json:', fs.existsSync(path.join(hbuildsNodejsDir, 'package.json')) ? 'EXISTS' : 'MISSING');
console.log(' - hbuilds/current/nodejs/dist/index.html:', fs.existsSync(path.join(hbuildsDistDir, 'index.html')) ? 'EXISTS' : 'MISSING');
console.log(' - public_html/.htaccess:', fs.existsSync(path.join(publicHtmlDir, '.htaccess')) ? 'EXISTS' : 'MISSING');
console.log(' - deploy.zip:', fs.existsSync(path.join(rootDir, 'deploy.zip')) ? 'EXISTS' : 'MISSING');

console.log('[build-server] Build and deployment preparation completed successfully!');
