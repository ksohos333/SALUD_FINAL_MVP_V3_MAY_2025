# ¡Salud! Language Learning Platform

¡Salud! is an AI-powered language learning platform that combines interactive lessons, immersive content, and writing exercises to help users learn languages effectively and naturally.

## Features

- Interactive language lessons with task-based learning
- Dynamic journaling with AI feedback
- Writing exercises and typing practice
- Cultural immersion content
- AI-powered feedback on language usage

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Local Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Salud_MVP
   ```

2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `ai_integration/ai_integration.env.example` to `ai_integration/ai_integration.env`
   - Add your OpenAI API key to the `.env` file:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

### Running the Application

#### HTTP Mode (Default)

Run the application with HTTP:

```
python app.py
```

The application will be available at http://localhost:5000

#### HTTPS Mode (Secure)

Run the application with HTTPS:

```
python app.py --https
```

The application will be available at https://localhost:5000

Note: Since this uses a self-signed certificate, your browser will show a security warning. You can proceed by accepting the risk or adding an exception for this certificate.

### Running on Replit

1. Create a new Replit project and import this repository.

2. Set up environment variables in Replit:
   - Go to the "Secrets" tab in your Replit project
   - Add a new secret with key `OPENAI_API_KEY` and your API key as the value

3. The application should automatically use the correct port for Replit.

4. Click the "Run" button in Replit to start the application.

## Project Structure

- `app.py`: Main Flask application
- `ai_integration/`: AI integration modules
- `journaling/`: Journal functionality
- `writing_exercises/`: Writing exercises functionality
- `lessons/`: Lesson generation functionality
- `immersion/`: Immersion content functionality
- `static/`: Static files (CSS, JS, images)
- `templates/`: HTML templates
- `generate_cert.py`: Script to generate SSL certificates for HTTPS

## Troubleshooting

### Firewall or Proxy Issues

If you're behind a firewall or proxy that blocks HTTP connections, use the HTTPS mode:

```
python app.py --https
```

### Port Conflicts

If port 5000 is already in use, you can specify a different port:

```
PORT=5001 python app.py
```

### SSL Certificate Issues

If you encounter issues with the SSL certificates, you can manually generate them:

```
python generate_cert.py
```

This will create the necessary certificate files in the `certs/` directory.

## License

[License information]
