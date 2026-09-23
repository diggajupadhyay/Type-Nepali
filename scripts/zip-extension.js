/**
 * Zip Extension for Distribution
 * Creates a zip file of the dist folder for publishing.
 * @version 1.5.1
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

function zipExtension() {
  

  if (!fs.existsSync(DIST_DIR)) {
    process.stderr.write('❌ dist/ folder not found. Run "npm run build" first.\n');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const version = manifest.version.replace(/\./g, '-');
  const zipName = `type-nepali-${version}.zip`;

  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  const zipPath = path.join(BUILD_DIR, zipName);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    execSync(`cd "${DIST_DIR}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });

    const stats = fs.statSync(zipPath);
    const size = (stats.size / 1024).toFixed(2);

    process.stdout.write('\n✅ Package created!\n');
    process.stdout.write(`📦 File: ${zipName}\n`);
    process.stdout.write(`📏 Size: ${size} KB\n`);
    process.stdout.write(`📁 Location: ${BUILD_DIR}\n\n`);
  } catch (error) {
    process.stderr.write(`\n❌ Failed to create zip: ${error.message}\n`);
    process.stdout.write('\n💡 Make sure zip is installed on your system\n');
    process.exit(1);
  }
}

zipExtension();