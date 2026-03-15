/**
 * Build Script for Type Nepali Extension
 * Copies files to dist folder and performs basic validation
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Files and folders to copy
const ITEMS_TO_COPY = [
  'manifest.json',
  'popup.html',
  'popup-styles.css',
  'help.html',
  'settings.html',
  'README.md',
  'scripts',
  'img'
];

/**
 * Copy file or directory recursively
 */
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);

  if (!exists) {
    console.warn(`⚠️  Source not found: ${src}`);

    return;
  }
  
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);

    for (const item of items) {
      copyRecursiveSync(
        path.join(src, item),
        path.join(dest, item)
      );
    }
  } else {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${path.relative(SRC_DIR, dest)}`);
  }
}

/**
 * Clean dist directory
 */
function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Validate manifest.json
 */
function validateManifest() {
  const manifestPath = path.join(SRC_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const required = ['manifest_version', 'name', 'version', 'description'];
  const missing = required.filter(key => !manifest[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required manifest fields: ${missing.join(', ')}`);
  }
  
  console.log(`✓ Manifest valid: ${manifest.name} v${manifest.version}`);

  return manifest;
}

/**
 * Main build function
 */
function build() {
  console.log('\n🔨 Building Type Nepali Extension...\n');
  
  try {
    // Clean and create dist
    cleanDist();
    
    // Validate manifest
    validateManifest();
    
    // Copy files
    console.log('\n📦 Copying files...\n');
    for (const item of ITEMS_TO_COPY) {
      const src = path.join(SRC_DIR, item);
      const dest = path.join(DIST_DIR, item);

      copyRecursiveSync(src, dest);
    }
    
    // Summary
    const files = fs.readdirSync(DIST_DIR);

    console.log('\n✅ Build complete!\n');
    console.log(`📁 Output: ${DIST_DIR}`);
    console.log(`📦 Files: ${files.length} items\n`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message, '\n');
    process.exit(1);
  }
}

// Run build
build();
