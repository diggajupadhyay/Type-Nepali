/**
 * Validate manifest.json for Type Nepali Extension
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

function validateManifest() {
  console.log('🔍 Validating manifest.json...\n');
  
  let manifest;
  
  // Check file exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json not found');
    process.exit(1);
  }
  
  // Parse JSON
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Invalid JSON:', error.message);
    process.exit(1);
  }
  
  // Required fields
  const required = {
    manifest_version: 'number',
    name: 'string',
    version: 'string',
    description: 'string'
  };
  
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const [field, type] of Object.entries(required)) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof manifest[field] !== type) {
      errors.push(`Field "${field}" should be of type ${type}`);
    }
  }
  
  // Check manifest_version
  if (manifest.manifest_version !== 3) {
    warnings.push('Consider using manifest_version 3 for latest features');
  }
  
  // Check version format
  const versionRegex = /^\d+\.\d+\.\d+$/;

  if (!versionRegex.test(manifest.version)) {
    warnings.push(`Version "${manifest.version}" should follow semver (e.g., 1.0.0)`);
  }
  
  // Check permissions
  if (manifest.permissions) {
    const dangerousPerms = ['<all_urls>', 'webRequest', 'webRequestBlocking'];
    const foundDangerous = manifest.permissions.filter(p => dangerousPerms.includes(p));

    if (foundDangerous.length > 0) {
      warnings.push(`Uses broad permissions: ${foundDangerous.join(', ')}`);
    }
  }
  
  // Check browser_specific_settings for Firefox
  if (!manifest.browser_specific_settings?.gecko?.id) {
    warnings.push('Missing Firefox extension ID in browser_specific_settings');
  }
  
  // Report results
  if (errors.length > 0) {
    console.error('❌ Errors:\n');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }
  
  // Success
  console.log('✅ Manifest is valid!\n');
  console.log(`📦 Extension: ${manifest.name}`);
  console.log(`🏷️  Version: ${manifest.version}`);
  console.log(`📝 Description: ${manifest.description}`);
  console.log(`🔧 Manifest v${manifest.manifest_version}\n`);
}

validateManifest();
