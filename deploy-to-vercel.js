// Deploy to Vercel Script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectName: 'salud-language-learning',
  vercelConfigPath: './vercel.json',
  v0ConfigPath: './v0.json',
  v0MetadataPath: './v0-metadata.json'
};

// Function to check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    const output = execSync('vercel --version', { encoding: 'utf8' });
    console.log(`Vercel CLI is installed: ${output.trim()}`);
    return true;
  } catch (error) {
    console.error('Vercel CLI is not installed. Please install it using: npm install -g vercel');
    return false;
  }
}

// Function to check if configuration files exist
function checkConfigFiles() {
  const files = [config.vercelConfigPath, config.v0ConfigPath, config.v0MetadataPath];
  let allFilesExist = true;

  files.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`Configuration file not found: ${file}`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Function to deploy to Vercel
function deployToVercel() {
  try {
    console.log('Deploying to Vercel...');
    execSync('vercel --confirm', { stdio: 'inherit' });
    console.log('Deployment to Vercel completed successfully!');
    return true;
  } catch (error) {
    console.error(`Error deploying to Vercel: ${error.message}`);
    return false;
  }
}

// Function to connect to V0
function connectToV0() {
  console.log('To connect to V0:');
  console.log('1. Go to https://v0.dev/ and create a new project');
  console.log(`2. Name your project: ${config.projectName}`);
  console.log('3. Link your GitHub repository');
  console.log('4. In the V0 dashboard, configure the project to use the v0.json configuration');
  console.log('5. Deploy your project from the V0 dashboard');
  
  // Read V0 metadata
  try {
    const v0Metadata = JSON.parse(fs.readFileSync(config.v0MetadataPath, 'utf8'));
    console.log('\nV0 Metadata Summary:');
    console.log(`Project Name: ${v0Metadata.projectName}`);
    console.log(`Framework: ${v0Metadata.framework}`);
    console.log(`Components: ${v0Metadata.components.length}`);
    console.log(`Pages: ${v0Metadata.pages.length}`);
  } catch (error) {
    console.error(`Error reading V0 metadata: ${error.message}`);
  }
}

// Main execution
function main() {
  console.log('=== Deployment Script for Salud Language Learning Platform ===');
  
  // Check prerequisites
  const vercelInstalled = checkVercelCLI();
  const configFilesExist = checkConfigFiles();
  
  if (!vercelInstalled || !configFilesExist) {
    console.error('Prerequisites not met. Please fix the issues above and try again.');
    return;
  }
  
  // Deploy to Vercel
  const deploymentSuccessful = deployToVercel();
  
  // Connect to V0
  if (deploymentSuccessful) {
    connectToV0();
  }
  
  console.log('=== Deployment Script Completed ===');
}

// Run the script
main();
