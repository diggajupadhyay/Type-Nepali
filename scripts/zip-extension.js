/**
 * Zip Extension for Distribution
 * Creates a zip file of the dist folder for publishing
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

function zipExtension() {
  console.log('📦 Creating extension package...\n');
  
  // Check dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ folder not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Get version from manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const version = manifest.version.replace(/\./g, '-');
  const zipName = `type-nepali-${version}.zip`;
  
  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
  
  const zipPath = path.join(BUILD_DIR, zipName);
  
  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  try {
    // Use system zip command
    const cmd = `cd "${DIST_DIR}" && zip -r "${zipPath}" .`;

    execSync(cmd, { stdio: 'inherit' });
    
    const stats = fs.statSync(zipPath);
    const size = (stats.size / 1024).toFixed(2);
    
    console.log('\n✅ Package created!\n');
    console.log(`📦 File: ${zipName}`);
    console.log(`📏 Size: ${size} KB`);
    console.log(`📁 Location: ${BUILD_DIR}\n`);
    
  } catch (error) {
    console.error('\n❌ Failed to create zip:', error.message);
    console.log('\n💡 Make sure zip is installed on your system\n');
    process.exit(1);
  }
}

zipExtension();
