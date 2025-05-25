# Development Guide for Salud Language Learning Platform

This guide provides instructions for setting up and running the Salud Language Learning Platform in development mode.

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/salud-language-learning.git
   cd salud-language-learning
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   NEXT_PUBLIC_API_TIMEOUT=30000
   NEXT_PUBLIC_ENV=development
   ```

## Running the Application

### Running Frontend and Backend Separately

1. Start the Flask backend:
   ```bash
   python app.py
   ```

2. In a separate terminal, start the Next.js frontend:
   ```bash
   npm run dev
   ```

### Running Both Together

We provide a convenience script to run both the frontend and backend together:

```bash
npm run dev:all
```

This script starts both servers and displays their logs in a single terminal window.

## Testing

### Testing the API Connection

To test the API connection between the frontend and backend:

```bash
npm run test:api
```

This script makes a simple request to the test endpoint and logs the response.

### Running Frontend Tests

```bash
npm run test
```

### Running Backend Tests

```bash
python -m pytest
```

## Development Workflow

1. Make changes to the code
2. Test your changes locally
3. Commit your changes
4. Push to your branch
5. Create a pull request

## Project Structure

- `pages/` - Next.js pages
- `components/` - Reusable React components
- `styles/` - CSS and styling
- `public/` - Static assets
- `lib/` - Utility functions and modules
  - `api/` - API client for backend communication
  - `utils/` - Helper functions
- `templates/` - Flask HTML templates (legacy)
- `static/` - Static assets for Flask (legacy)
- `app.py` - Flask application entry point
- `auth.py` - Authentication logic
- `models.py` - Database models

## API Client

The API client in `lib/api/` provides a clean interface for making requests to the backend. See the [API Client README](lib/api/README.md) for more information.

### API Response Format

All API responses follow a consistent format with a success flag pattern:

```javascript
{
  success: true | false,  // Indicates if the request was successful
  message: "...",         // A message describing the result or error
  data: { ... }           // The actual data returned (varies by endpoint)
}
```

For example, when fetching vocabulary words:

```javascript
// Success response
{
  success: true,
  words: [{ id: 1, word: 'casa', translation: 'house', ... }],
  message: "Successfully retrieved vocabulary"
}

// Error response
{
  success: false,
  words: [],
  message: "Failed to fetch vocabulary: Unauthorized"
}
```

### Error Handling

The API client handles errors consistently across all modules:

1. Each API function wraps the actual API call in a try/catch block
2. If the API call succeeds, it returns an object with `success: true` and the data
3. If the API call fails, it returns an object with `success: false` and an error message
4. Frontend components check the `success` flag to determine how to handle the response

This pattern makes error handling more predictable and allows for graceful degradation when API calls fail.

## Troubleshooting

### API Connection Issues

If you're having trouble connecting to the API:

1. Make sure the Flask backend is running on port 5000
2. Check CORS configuration in the Flask app
3. Verify network connectivity between frontend and backend
4. Check that the `.env.local` file contains the correct API base URL
5. Look for error messages in the browser console or server logs
6. Use the API test script to verify connectivity: `npm run test:api`

### API Response Issues

If you're getting unexpected API responses:

1. Check the `success` flag in the response to determine if the request succeeded
2. Look at the `message` field for more information about what went wrong
3. Verify that you're sending the correct data in the request
4. Check that you're handling the response correctly in your component
5. Use the browser's network tab to inspect the actual request and response

### Database Issues

If you're having trouble with the database:

1. Make sure the database file exists and is writable
2. Check the database connection string in the Flask app
3. Verify that the database schema is up to date

## Deployment

See the [README.md](README.md) file for deployment instructions.
