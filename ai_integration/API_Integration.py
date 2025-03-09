import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Try to get API key from environment variables
api_key = os.getenv('OPENAI_API_KEY')

# If not found, try to get it from .replit file
if not api_key:
    try:
        # Check if we're on Replit
        if os.environ.get('REPL_ID'):
            # Try to read the API key from .replit file
            import configparser
            config = configparser.ConfigParser()
            config.read('.replit')
            if 'secrets' in config and 'OPENAI_API_KEY' in config['secrets']:
                api_key = config['secrets']['OPENAI_API_KEY']
    except Exception as e:
        print(f"Error reading API key from .replit: {e}")

# Debug: Print to check if the API key is loaded
print("API Key loaded:", api_key is not None)

# Initialize OpenAI client with fallback to empty string to avoid crash
# (will still fail on API calls but won't crash on import)
client = OpenAI(api_key=api_key or "")

def generate_lesson(prompt):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a language learning assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150
    )
    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    prompt = "Generate an interactive language lesson for beginners in Spanish."
    print(generate_lesson(prompt))
