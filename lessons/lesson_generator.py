import json
import os
import datetime
import openai
from ai_integration.API_Integration import generate_lesson

# Use in-memory storage for Vercel deployment
# Check if running on Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'

# In-memory storage for lessons when on Vercel
LESSONS_MEMORY = []

# Local directory for lessons when running locally
LESSONS_DIR = os.path.join(os.path.dirname(__file__), 'generated')
if not IS_VERCEL:
    os.makedirs(LESSONS_DIR, exist_ok=True)

def generate_interactive_lesson(language='Spanish', level='beginner', topic='greetings', task_based=True):
    """
    Generate an interactive, task-based language lesson.
    
    Args:
        language (str): The target language
        level (str): The difficulty level (beginner, intermediate, advanced)
        topic (str): The topic of the lesson
        task_based (bool): Whether to make the lesson task-based
        
    Returns:
        dict: The generated lesson
    """
    # Generate a unique ID for the lesson
    lesson_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Create the prompt for the AI
    task_str = "task-based, purpose-driven " if task_based else ""
    prompt = f"""
    Generate a {task_str}interactive language lesson for {level} level students learning {language} about {topic}.
    
    Include the following sections:
    1. Lesson Objectives (what the student will learn)
    2. Vocabulary (10-15 key words/phrases with translations)
    3. Grammar Points (explain 1-2 relevant grammar concepts)
    4. Interactive Dialogue (a realistic conversation using the vocabulary and grammar)
    5. Practice Exercises (3-5 exercises to reinforce learning)
    6. Cultural Notes (relevant cultural context)
    7. Task Challenge (a real-world task the student should complete using what they learned)
    
    Format the response in a structured way with clear section headings.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=1000
        )
        
        content = response.choices[0].text.strip()
        
        # Create the lesson object
        lesson = {
            'id': lesson_id,
            'language': language,
            'level': level,
            'topic': topic,
            'task_based': task_based,
            'content': content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            LESSONS_MEMORY.append(lesson)
        else:
            # Save the lesson to a file when running locally
            filename = f"{lesson_id}.json"
            filepath = os.path.join(LESSONS_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(lesson, f, ensure_ascii=False, indent=2)
        
        return lesson
    
    except Exception as e:
        print(f"Error generating lesson: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate lesson'
        }

def generate_subject_based_lesson(language='Spanish', level='beginner', subject='mathematics', topic='basic arithmetic'):
    """
    Generate a subject-based immersion lesson where users learn a subject in the target language.
    
    Args:
        language (str): The target language
        level (str): The difficulty level (beginner, intermediate, advanced)
        subject (str): The academic subject (mathematics, history, science, etc.)
        topic (str): The specific topic within the subject
        
    Returns:
        dict: The generated lesson
    """
    # Generate a unique ID for the lesson
    lesson_id = f"subject_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Create the prompt for the AI
    prompt = f"""
    Generate a subject-based immersion lesson for {level} level students learning {language}.
    The lesson should teach {subject} (specifically about {topic}) while using {language} as the medium of instruction.
    
    Include the following sections:
    1. Lesson Objectives (what the student will learn about {subject})
    2. Key Terminology (10-15 subject-specific terms in {language} with translations)
    3. Concept Explanation (explain the {topic} concepts in simple {language})
    4. Examples (provide examples of the concepts with explanations)
    5. Practice Problems (3-5 exercises related to {subject})
    6. Language Focus (highlight key language structures used in this subject area)
    7. Cultural Context (how this subject might be taught in countries where {language} is spoken)
    
    Format the response in a structured way with clear section headings.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=1000
        )
        
        content = response.choices[0].text.strip()
        
        # Create the lesson object
        lesson = {
            'id': lesson_id,
            'language': language,
            'level': level,
            'subject': subject,
            'topic': topic,
            'content': content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            LESSONS_MEMORY.append(lesson)
        else:
            # Save the lesson to a file when running locally
            filename = f"{lesson_id}.json"
            filepath = os.path.join(LESSONS_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(lesson, f, ensure_ascii=False, indent=2)
        
        return lesson
    
    except Exception as e:
        print(f"Error generating subject-based lesson: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate subject-based lesson'
        }

def get_recent_lessons(limit=10):
    """
    Get the most recent lessons.
    
    Args:
        limit (int): Maximum number of lessons to return
        
    Returns:
        list: List of lessons
    """
    if IS_VERCEL:
        # Return from in-memory storage when on Vercel
        # Sort by timestamp (newest first) and limit
        sorted_lessons = sorted(
            LESSONS_MEMORY, 
            key=lambda x: x.get('timestamp', ''), 
            reverse=True
        )
        return sorted_lessons[:limit]
    else:
        # Return from file system when running locally
        lessons = []
        
        # Check if the directory exists
        if not os.path.exists(LESSONS_DIR):
            return lessons
        
        # Get all JSON files in the directory
        files = [f for f in os.listdir(LESSONS_DIR) if f.endswith('.json')]
        
        # Sort files by name (which is based on timestamp)
        files.sort(reverse=True)
        
        # Load the lessons
        for filename in files[:limit]:
            filepath = os.path.join(LESSONS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                lesson = json.load(f)
                lessons.append(lesson)
        
        return lessons

def get_lesson_by_id(lesson_id):
    """
    Get a specific lesson by its ID.
    
    Args:
        lesson_id (str): The ID of the lesson to retrieve
        
    Returns:
        dict: The lesson object or None if not found
    """
    if IS_VERCEL:
        # Find in memory when on Vercel
        for lesson in LESSONS_MEMORY:
            if lesson.get('id') == lesson_id:
                return lesson
        return None
    else:
        # Try to find in file system when running locally
        if not os.path.exists(LESSONS_DIR):
            return None
        
        # First try direct filename match
        filepath = os.path.join(LESSONS_DIR, f"{lesson_id}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # If not found, search through all files
        for filename in os.listdir(LESSONS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(LESSONS_DIR, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    lesson = json.load(f)
                    if lesson.get('id') == lesson_id:
                        return lesson
        
        return None
