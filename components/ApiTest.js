import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { TEST_ENDPOINT } from '../lib/api/config';

export default function ApiTest() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        const data = await apiClient.get(TEST_ENDPOINT);
        setApiResponse(data);
        setLoading(false);
      } catch (err) {
        console.error('Error testing API:', err);
        setError(err.message || 'API connection failed');
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Testing API connection...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-600 mb-2">API Connection Error</h3>
        <p className="text-red-500">{error}</p>
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium">Troubleshooting:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Make sure the Flask backend is running on port 5000</li>
            <li>Check CORS configuration in the Flask app</li>
            <li>Verify network connectivity between frontend and backend</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <h3 className="text-lg font-medium text-green-600 mb-2">API Connection Successful!</h3>
      <div className="bg-white p-3 rounded border border-green-100">
        <pre className="text-sm overflow-auto">{JSON.stringify(apiResponse, null, 2)}</pre>
      </div>
    </div>
  );
}
