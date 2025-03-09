from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Debug: Print to check if the API key is loaded
print("API Key loaded:", os.getenv('OPENAI_API_KEY') is not None)

# Initialize the client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def generate_lesson(prompt):
    response = client.completions.create(
        model="gpt-3.5-turbo-instruct",  # or another available model
        prompt=prompt,
        max_tokens=150
    )
    return response.choices[0].text.strip()

if __name__ == "__main__":
    prompt = "Generate an interactive language lesson for beginners in Spanish."
    print(generate_lesson(prompt))
