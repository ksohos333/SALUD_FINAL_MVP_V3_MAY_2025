import React from 'react';
import ApiTest from '../components/ApiTest';

export default function ApiTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="mb-6">
        <p className="text-gray-700">
          This page tests the connection between the Next.js frontend and the Flask backend.
          It attempts to call the <code className="bg-gray-100 px-1 py-0.5 rounded">/api/test</code> endpoint
          which doesn't require authentication.
        </p>
      </div>
      
      <div className="mb-8">
        <ApiTest />
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">Next Steps</h2>
        <p className="mb-2">
          Once the API connection is working, we can proceed with implementing:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Authentication between Next.js and Flask</li>
          <li>Learning Phase tracking</li>
          <li>Immersion session logging</li>
          <li>Dashboard visualization</li>
        </ul>
      </div>
    </div>
  );
}
