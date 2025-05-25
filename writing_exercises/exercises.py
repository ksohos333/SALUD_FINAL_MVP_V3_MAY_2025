import json
import os
import datetime
import openai
from ai_integration.API_Integration import generate_lesson

# Use in-memory storage for Vercel deployment
# Check if running on Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'

# In-memory storage for exercises when on Vercel
EXERCISES_MEMORY = {}

# Local directory for exercises when running locally
EXERCISES_DIR = os.path.join(os.path.dirname(__file__), 'generated')
if not IS_VERCEL:
    os.makedirs(EXERCISES_DIR, exist_ok=True)

def generate_writing_exercise(language='Spanish', level='beginner', topic=None):
    """
    Generate a writing exercise for language learning.
    
    Args:
        language (str): The target language
        level (str): The difficulty level (beginner, intermediate, advanced)
        topic (str, optional): Specific topic for the exercise
        
    Returns:
        dict: The generated writing exercise
    """
    # Generate a unique ID for the exercise
    exercise_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Create the prompt for the AI
    topic_str = f" about {topic}" if topic else ""
    prompt = f"""
    Generate a writing exercise for {level} level students learning {language}{topic_str}.
    
    Include the following:
    1. A clear writing prompt or task
    2. Any necessary vocabulary or phrases that might be helpful
    3. Grammar points to focus on
    4. A sample response (short example)
    5. Word count target
    
    Format the response in a structured way with clear sections.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=500
        )
        
        content = response.choices[0].text.strip()
        
        # Create the exercise object
        exercise = {
            'id': exercise_id,
            'language': language,
            'level': level,
            'topic': topic,
            'content': content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            EXERCISES_MEMORY[exercise_id] = exercise
        else:
            # Save the exercise to a file when running locally
            filename = f"{exercise_id}.json"
            filepath = os.path.join(EXERCISES_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(exercise, f, ensure_ascii=False, indent=2)
        
        return exercise
    
    except Exception as e:
        print(f"Error generating writing exercise: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate writing exercise'
        }

def check_writing(content, language='Spanish', exercise_id=None):
    """
    Check a writing submission and provide feedback.
    
    Args:
        content (str): The writing submission to check
        language (str): The language of the submission
        exercise_id (str, optional): The ID of the exercise being responded to
        
    Returns:
        dict: Feedback on the writing submission
    """
    # Get the exercise if an ID is provided
    exercise_content = ""
    if exercise_id:
        if IS_VERCEL:
            # Get from memory when on Vercel
            if exercise_id in EXERCISES_MEMORY:
                exercise = EXERCISES_MEMORY[exercise_id]
                exercise_content = f"\nThis is in response to the following exercise:\n{exercise['content']}"
        else:
            # Get from file when running locally
            filepath = os.path.join(EXERCISES_DIR, f"{exercise_id}.json")
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    exercise = json.load(f)
                    exercise_content = f"\nThis is in response to the following exercise:\n{exercise['content']}"
    
    # Create the prompt for the AI
    prompt = f"""
    Analyze the following writing submission in {language} and provide detailed feedback:{exercise_content}
    
    Submission:
    {content}
    
    Provide feedback in the following format:
    1. Grammar corrections (list specific errors and corrections)
    2. Vocabulary usage (suggest better word choices or additional vocabulary)
    3. Structure and coherence (comment on the organization and flow)
    4. Style and tone (provide suggestions for improvement)
    5. Overall assessment (strengths and areas for improvement)
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=500
        )
        
        feedback_text = response.choices[0].text.strip()
        
        # Parse the feedback into sections
        sections = feedback_text.split('\n\n')
        
        feedback = {
            'grammar': sections[0] if len(sections) > 0 else "No grammar feedback available.",
            'vocabulary': sections[1] if len(sections) > 1 else "No vocabulary feedback available.",
            'structure': sections[2] if len(sections) > 2 else "No structure feedback available.",
            'style': sections[3] if len(sections) > 3 else "No style feedback available.",
            'overall': sections[4] if len(sections) > 4 else "No overall assessment available."
        }
        
        return feedback
    
    except Exception as e:
        print(f"Error checking writing: {e}")
        return {
            'error': str(e),
            'message': 'Failed to check writing submission'
        }

def get_typing_exercise(language='Spanish', script_type='standard', difficulty='beginner'):
    """
    Generate a typing exercise for practicing keyboard skills in different scripts.
    
    Args:
        language (str): The target language
        script_type (str): The type of script (standard, cursive, calligraphy)
        difficulty (str): The difficulty level
        
    Returns:
        dict: The generated typing exercise
    """
    # Create the prompt for the AI
    prompt = f"""
    Generate a typing exercise for {difficulty} level students learning to type in {language} using {script_type} script.
    
    Include the following:
    1. A short paragraph (3-5 sentences) that includes common characters/symbols in this script
    2. A list of the most challenging characters to type in this script
    3. Tips for typing efficiently in this script
    
    Format the response in a structured way with clear sections.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=400
        )
        
        content = response.choices[0].text.strip()
        
        # Create the exercise object
        exercise = {
            'language': language,
            'script_type': script_type,
            'difficulty': difficulty,
            'content': content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        return exercise
    
    except Exception as e:
        print(f"Error generating typing exercise: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate typing exercise'
        }
