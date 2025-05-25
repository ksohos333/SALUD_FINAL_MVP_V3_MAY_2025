// V0 Integration Script for Salud Language Learning Platform
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectName: 'Salud Language Learning',
  components: [
    { name: 'Header', path: './components/Header.js' },
    { name: 'Footer', path: './components/Footer.js' },
    { name: 'Layout', path: './components/Layout.js' },
    { name: 'FeatureCard', path: './pages/index.js' },
    { name: 'LessonCard', path: './pages/lessons/index.js' },
    { name: 'JournalEntry', path: './pages/journal/index.js' }
  ],
  pages: [
    { name: 'Home', path: './pages/index.js' },
    { name: 'Lessons', path: './pages/lessons/index.js' },
    { name: 'Journal', path: './pages/journal/index.js' }
  ]
};

// Function to extract component metadata
function extractComponentMetadata() {
  const metadata = {
    components: [],
    pages: []
  };

  // Extract component metadata
  config.components.forEach(component => {
    try {
      const content = fs.readFileSync(component.path, 'utf8');
      metadata.components.push({
        name: component.name,
        path: component.path,
        size: content.length
      });
    } catch (error) {
      console.error(`Error reading component ${component.name}: ${error.message}`);
    }
  });

  // Extract page metadata
  config.pages.forEach(page => {
    try {
      const content = fs.readFileSync(page.path, 'utf8');
      metadata.pages.push({
        name: page.name,
        path: page.path,
        size: content.length
      });
    } catch (error) {
      console.error(`Error reading page ${page.name}: ${error.message}`);
    }
  });

  return metadata;
}

// Generate V0 metadata file
function generateV0Metadata() {
  const metadata = extractComponentMetadata();
  const v0Metadata = {
    projectName: config.projectName,
    framework: 'Next.js',
    components: metadata.components,
    pages: metadata.pages,
    timestamp: new Date().toISOString()
  };

  try {
    fs.writeFileSync('v0-metadata.json', JSON.stringify(v0Metadata, null, 2));
    console.log('V0 metadata generated successfully!');
  } catch (error) {
    console.error(`Error writing V0 metadata: ${error.message}`);
  }
}

// Main execution
generateV0Metadata();

console.log('V0 integration script completed.');
console.log('To connect to V0:');
console.log('1. Create a new project in V0');
console.log('2. Link your GitHub repository');
console.log('3. Configure V0 to use the v0.json configuration');
console.log('4. Deploy your project');
