/**
 * Standalone API Test Script
 * 
 * This script tests the API connection without relying on the API client module.
 * It makes a simple request to the test endpoint and logs the response.
 * 
 * Usage: node scripts/standalone-test.js
 */

import fetch from 'node-fetch';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const TEST_ENDPOINT = '/api/test';

// Test the API connection
async function testApiConnection() {
  console.log('Testing API connection...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Endpoint: ${TEST_ENDPOINT}`);
  
  const url = `${API_BASE_URL}${TEST_ENDPOINT}`;
  console.log(`Full URL: ${url}`);
  
  try {
    // Make a request to the test endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Log the response
    console.log('\nAPI Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for success flag
    if (data.success === true) {
      console.log('\nAPI test successful! The API is using the success flag pattern.');
    } else if (data.success === false) {
      console.log('\nAPI returned a failure response with the success flag pattern:');
      console.log(`Message: ${data.message}`);
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
testApiConnection();
