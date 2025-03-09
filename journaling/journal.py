import json
import os
import datetime
import openai
from ai_integration.API_Integration import generate_lesson

# Ensure the journal entries directory exists
JOURNAL_DIR = os.path.join(os.path.dirname(__file__), 'entries')
os.makedirs(JOURNAL_DIR, exist_ok=True)

def create_journal_entry(content, language='Spanish'):
    """
    Create a new journal entry and save it to a JSON file.
    
    Args:
        content (str): The content of the journal entry
        language (str): The language of the journal entry
        
    Returns:
        dict: The created journal entry with AI feedback
    """
    # Generate a unique ID for the entry
    entry_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Get AI feedback on the entry
    feedback = get_ai_feedback(content, language)
    
    # Create the entry object
    entry = {
        'id': entry_id,
        'content': content,
        'language': language,
        'timestamp': datetime.datetime.now().isoformat(),
        'feedback': feedback
    }
    
    # Save the entry to a file
    filename = f"{entry_id}.json"
    filepath = os.path.join(JOURNAL_DIR, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(entry, f, ensure_ascii=False, indent=2)
    
    return entry

def get_journal_entries(limit=10):
    """
    Get the most recent journal entries.
    
    Args:
        limit (int): Maximum number of entries to return
        
    Returns:
        list: List of journal entries
    """
    entries = []
    
    # Check if the directory exists
    if not os.path.exists(JOURNAL_DIR):
        return entries
    
    # Get all JSON files in the directory
    files = [f for f in os.listdir(JOURNAL_DIR) if f.endswith('.json')]
    
    # Sort files by name (which is based on timestamp)
    files.sort(reverse=True)
    
    # Load the entries
    for filename in files[:limit]:
        filepath = os.path.join(JOURNAL_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            entry = json.load(f)
            entries.append(entry)
    
    return entries

def get_ai_feedback(content, language):
    """
    Get AI feedback on a journal entry.
    
    Args:
        content (str): The content of the journal entry
        language (str): The language of the journal entry
        
    Returns:
        dict: Feedback including grammar corrections and suggestions
    """
    prompt = f"""
    Analyze the following journal entry in {language} and provide feedback:
    
    {content}
    
    Provide feedback in the following format:
    1. Grammar corrections
    2. Vocabulary suggestions
    3. Cultural insights
    4. Overall fluency assessment
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=300
        )
        
        feedback_text = response.choices[0].text.strip()
        
        # Parse the feedback into sections
        sections = feedback_text.split('\n\n')
        
        feedback = {
            'grammar': sections[0] if len(sections) > 0 else "No grammar feedback available.",
            'vocabulary': sections[1] if len(sections) > 1 else "No vocabulary suggestions available.",
            'cultural': sections[2] if len(sections) > 2 else "No cultural insights available.",
            'fluency': sections[3] if len(sections) > 3 else "No fluency assessment available."
        }
        
        return feedback
    except Exception as e:
        print(f"Error getting AI feedback: {e}")
        return {
            'grammar': "Error generating feedback.",
            'vocabulary': "Error generating feedback.",
            'cultural': "Error generating feedback.",
            'fluency': "Error generating feedback."
        }
