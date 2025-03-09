# Setting Up ¡Salud! Language Learning Platform on Replit

This guide will help you set up and run the ¡Salud! Language Learning Platform on Replit.

## Prerequisites

- A Replit account
- Basic knowledge of Python and Flask

## Step 1: Fork the Repository

1. Go to the Replit dashboard
2. Click on "Create Repl"
3. Select "Import from GitHub"
4. Enter the repository URL: `https://github.com/yourusername/salud-language-learning`
5. Choose "Python" as the language
6. Click "Import from GitHub"

## Step 2: Configure Environment Variables

1. In your Repl, click on the "Secrets" tab (lock icon) in the left sidebar
2. Add the following environment variables:
   - `SECRET_KEY`: A secure random string for Flask sessions
   - `OPENAI_API_KEY`: Your OpenAI API key for AI features
   - `MAIL_USERNAME`: Email address for sending verification emails
   - `MAIL_PASSWORD`: Password or app-specific password for the email account
   - `MAIL_SERVER`: SMTP server (e.g., smtp.gmail.com)
   - `MAIL_PORT`: SMTP port (e.g., 587)
   - `MAIL_USE_TLS`: Set to "True" for TLS encryption
   - `MAIL_DEFAULT_SENDER`: Default sender email address

## Step 3: Configure the Replit Database

1. Open the `.replit` file and ensure it contains:
   ```
   run = "python app.py"
   ```

2. Create a `replit.nix` file with the following content if it doesn't exist:
   ```nix
   { pkgs }: {
     deps = [
       pkgs.python310
       pkgs.python310Packages.flask
       pkgs.python310Packages.pip
       pkgs.python310Packages.python-dotenv
     ];
   }
   ```

## Step 4: Install Dependencies

1. Open the Shell in Replit
2. Run the following command to install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Step 5: Initialize the Database

1. In the Shell, run:
   ```
   python -c "from app import app, db; app.app_context().push(); db.create_all()"
   ```

## Step 6: Run the Application

1. Click the "Run" button at the top of the Replit interface
2. The application should start and be accessible via the provided URL

## Troubleshooting Common Issues

### Application Crashes on Startup

- Check that all required environment variables are set in the Secrets tab
- Ensure the database initialization step was completed successfully
- Check the console output for specific error messages

### Database Errors

- If you encounter database errors, try reinitializing the database:
  ```
  python -c "from app import app, db; app.app_context().push(); db.drop_all(); db.create_all()"
  ```
  Note: This will delete all existing data

### Email Sending Issues

- If verification emails aren't being sent:
  - Check that MAIL_* environment variables are set correctly
  - For Gmail, ensure "Less secure app access" is enabled or use an App Password
  - Try a different email provider if problems persist

### OpenAI API Issues

- If AI features aren't working:
  - Verify your OpenAI API key is valid and has sufficient credits
  - Check for rate limiting or quota issues in the OpenAI dashboard

## Customizing for Replit

### Persistent Storage

Replit's filesystem is ephemeral, meaning files may not persist between sessions. For user-generated content:

1. Use the Replit Database for important data:
   ```python
   from replit import db
   
   # Store data
   db["key"] = value
   
   # Retrieve data
   value = db["key"]
   ```

2. Or use SQLite with a path in a persistent directory:
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///salud.db'
   ```

### Always-On Repl

To keep your application running 24/7:

1. Upgrade to a paid Replit plan with "Always On" capability
2. Enable "Always On" in your Repl settings

## Additional Resources

- [Replit Documentation](https://docs.replit.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
