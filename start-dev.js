/**
 * Development Server Starter
 * 
 * This script starts both the Next.js frontend and Flask backend servers
 * in development mode. It uses concurrently to run both servers in parallel.
 * 
 * Usage: node start-dev.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk') || { green: (text) => text, blue: (text) => text, yellow: (text) => text, red: (text) => text };

// Configuration
const FLASK_PORT = 5000;
const NEXT_PORT = 3000;
const FLASK_APP = 'app.py';

// Check if the Flask app exists
if (!fs.existsSync(path.join(process.cwd(), FLASK_APP))) {
  console.error(chalk.red(`Error: Flask app '${FLASK_APP}' not found.`));
  console.error(chalk.yellow('Make sure you are running this script from the project root directory.'));
  process.exit(1);
}

// Function to format log output with prefixes
function formatLogs(data, prefix) {
  return data
    .toString()
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `${prefix} ${line}`)
    .join('\n');
}

// Start Flask backend
console.log(chalk.blue('Starting Flask backend...'));
const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
const flaskProcess = spawn(pythonPath, [FLASK_APP], {
  env: { ...process.env, FLASK_APP, FLASK_ENV: 'development', FLASK_DEBUG: '1' }
});

flaskProcess.stdout.on('data', (data) => {
  console.log(formatLogs(data, chalk.green('[Flask]')));
});

flaskProcess.stderr.on('data', (data) => {
  console.error(formatLogs(data, chalk.red('[Flask Error]')));
});

// Start Next.js frontend
console.log(chalk.blue('Starting Next.js frontend...'));
const npmPath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nextProcess = spawn(npmPath, ['run', 'dev'], {
  env: { ...process.env, PORT: NEXT_PORT }
});

nextProcess.stdout.on('data', (data) => {
  console.log(formatLogs(data, chalk.green('[Next.js]')));
});

nextProcess.stderr.on('data', (data) => {
  console.error(formatLogs(data, chalk.red('[Next.js Error]')));
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down development servers...'));
  flaskProcess.kill();
  nextProcess.kill();
  process.exit(0);
});

// Log URLs
setTimeout(() => {
  console.log('\n' + chalk.blue('='.repeat(50)));
  console.log(chalk.green('Development servers started:'));
  console.log(chalk.blue('Frontend: ') + chalk.yellow(`http://localhost:${NEXT_PORT}`));
  console.log(chalk.blue('Backend API: ') + chalk.yellow(`http://localhost:${FLASK_PORT}`));
  console.log(chalk.blue('='.repeat(50)) + '\n');
}, 2000);
