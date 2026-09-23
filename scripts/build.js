/**
 * Build Script for Type Nepali Extension
 * Copies files to dist folder and performs basic validation.
 * @version 1.5.1
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, '..', 'dist');

/** Files and folders to copy into the dist bundle */
const ITEMS_TO_COPY = [
  'manifest.json',
  'popup.html',
  'popup-styles.css',
  'scripts',
  'img'
];

/**
 * Recursively copy a file or directory.
 * @param {string} src
 * @param {string} dest
 */
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const item of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Clean the dist directory */
function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Validate the manifest has required fields */
function validateManifest() {
  const manifestPath = path.join(SRC_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const required = ['manifest_version', 'name', 'version', 'description'];
  const missing = required.filter(key => !manifest[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required manifest fields: ${missing.join(', ')}`);
  }

  
  return manifest;
}

/** Main build function */
function build() {

  try {
    cleanDist();
    validateManifest();

    
    for (const item of ITEMS_TO_COPY) {
      copyRecursiveSync(path.join(SRC_DIR, item), path.join(DIST_DIR, item));
    }

  } catch (error) {
    process.exit(1);
  }
}

build();