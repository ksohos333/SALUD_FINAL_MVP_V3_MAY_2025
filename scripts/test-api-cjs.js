/**
 * API Test Script (CommonJS version)
 * 
 * This script tests the API client by making a simple request to the test endpoint.
 * Run this script with Node.js to verify that the API client is working correctly.
 * 
 * Usage: node scripts/test-api-cjs.js
 */

// Create a simple fetch implementation for Node.js
const fetch = require('node-fetch');
global.fetch = fetch;

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = 30000;
const TEST_ENDPOINT = '/api/test';

// Simple API client for testing
const apiClient = {
  async get(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }
};

// Test the API client
async function testApiClient() {
  console.log('Testing API client...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Endpoint: ${TEST_ENDPOINT}`);
  
  try {
    // Make a request to the test endpoint
    const response = await apiClient.get(TEST_ENDPOINT);
    
    // Log the response
    console.log('\nAPI Response:');
    console.log(JSON.stringify(response, null, 2));
    
    // Check for success flag
    if (response.success === true) {
      console.log('\nAPI test successful! The API is using the success flag pattern.');
    } else if (response.success === false) {
      console.log('\nAPI returned a failure response with the success flag pattern:');
      console.log(`Message: ${response.message}`);
      process.exit(1);
    } else {
      console.log('\nAPI test successful, but the response does not use the success flag pattern.');
      console.log('Consider updating the API to use the success flag pattern for consistent error handling.');
    }
  } catch (error) {
    // Log any errors
    console.error('\nAPI test failed:');
    console.error(error);
    
    // Provide troubleshooting tips
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the Flask backend is running on port 5000');
    console.log('2. Check CORS configuration in the Flask app');
    console.log('3. Verify network connectivity between frontend and backend');
    console.log('4. Check that the .env.local file contains the correct API base URL');
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the test
testApiClient();
