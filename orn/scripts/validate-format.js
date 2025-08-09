#!/usr/bin/env node

/**
 * Format Validation Script for functions
 * Validates that all files are properly formatted according to Prettier rules
 */

const { execSync } = require('child_process');
const path = require('path');

function validateFormatting() {
    try {
        console.log('🔍 Checking code formatting...');
        
        execSync('npm run format:check', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
        
        console.log('✅ All files are properly formatted!');
        return true;
    } catch (error) {
        console.error('❌ Some files are not properly formatted.');
        console.error('Run "npm run format" to fix formatting issues.');
        return false;
    }
}

function autoFixFormatting() {
    try {
        console.log('🔧 Auto-fixing formatting issues...');
        
        execSync('npm run format', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
        
        console.log('✅ Formatting issues fixed!');
        return true;
    } catch (error) {
        console.error('❌ Failed to fix formatting issues:', error.message);
        return false;
    }
}

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix') || args.includes('-f');

if (shouldFix) {
    const success = autoFixFormatting();
    process.exit(success ? 0 : 1);
} else {
    const isValid = validateFormatting();
    process.exit(isValid ? 0 : 1);
}
