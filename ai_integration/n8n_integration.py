import requests
import json
import os
import datetime
from dotenv import load_dotenv
from .API_Integration import generate_lesson

# Load environment variables
load_dotenv()

# N8N webhook URLs (these would be set in the .env file in a real implementation)
N8N_BASE_URL = os.getenv('N8N_BASE_URL', 'http://localhost:5678')
N8N_LESSON_WEBHOOK = os.getenv('N8N_LESSON_WEBHOOK', '/webhook/lesson-generation')
N8N_JOURNAL_WEBHOOK = os.getenv('N8N_JOURNAL_WEBHOOK', '/webhook/journal-feedback')
N8N_WRITING_WEBHOOK = os.getenv('N8N_WRITING_WEBHOOK', '/webhook/writing-feedback')

def trigger_lesson_workflow(language, level, topic, user_id=None):
    """
    Trigger an n8n workflow to generate a lesson.
    
    Args:
        language (str): The target language
        level (str): The difficulty level
        topic (str): The lesson topic
        user_id (str, optional): The user ID for personalization
        
    Returns:
        dict: The response from n8n
    """
    payload = {
        'language': language,
        'level': level,
        'topic': topic,
        'user_id': user_id
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}{N8N_LESSON_WEBHOOK}",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            return {
                'success': True,
                'message': 'Lesson generation workflow triggered',
                'data': response.json()
            }
        else:
            return {
                'success': False,
                'message': f'Failed to trigger workflow: {response.status_code}',
                'error': response.text
            }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Error triggering workflow: {str(e)}'
        }

def trigger_journal_feedback_workflow(journal_entry, language, user_id=None):
    """
    Trigger an n8n workflow to process journal feedback.
    
    Args:
        journal_entry (str): The journal entry content
        language (str): The language of the entry
        user_id (str, optional): The user ID for personalization
        
    Returns:
        dict: The response from n8n
    """
    payload = {
        'journal_entry': journal_entry,
        'language': language,
        'user_id': user_id,
        'timestamp': str(datetime.datetime.now().isoformat())
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}{N8N_JOURNAL_WEBHOOK}",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            return {
                'success': True,
                'message': 'Journal feedback workflow triggered',
                'data': response.json()
            }
        else:
            return {
                'success': False,
                'message': f'Failed to trigger workflow: {response.status_code}',
                'error': response.text
            }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Error triggering workflow: {str(e)}'
        }

def trigger_writing_feedback_workflow(writing_submission, exercise_id, language, user_id=None):
    """
    Trigger an n8n workflow to process writing feedback.
    
    Args:
        writing_submission (str): The writing submission content
        exercise_id (str): The ID of the exercise being responded to
        language (str): The language of the submission
        user_id (str, optional): The user ID for personalization
        
    Returns:
        dict: The response from n8n
    """
    payload = {
        'writing_submission': writing_submission,
        'exercise_id': exercise_id,
        'language': language,
        'user_id': user_id,
        'timestamp': str(datetime.datetime.now().isoformat())
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}{N8N_WRITING_WEBHOOK}",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            return {
                'success': True,
                'message': 'Writing feedback workflow triggered',
                'data': response.json()
            }
        else:
            return {
                'success': False,
                'message': f'Failed to trigger workflow: {response.status_code}',
                'error': response.text
            }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Error triggering workflow: {str(e)}'
        }

def create_n8n_workflow_definition(name, description, nodes):
    """
    Create a workflow definition that can be imported into n8n.
    
    Args:
        name (str): The name of the workflow
        description (str): A description of what the workflow does
        nodes (list): A list of node definitions
        
    Returns:
        dict: The workflow definition
    """
    workflow = {
        "name": name,
        "nodes": nodes,
        "connections": {},  # Connections would be defined based on the nodes
        "active": False,
        "settings": {
            "saveManualExecutions": True,
            "callerPolicy": "workflowsFromSameOwner"
        },
        "tags": ["¡Salud!", "language-learning"],
        "createdAt": str(datetime.datetime.now().isoformat()),
        "updatedAt": str(datetime.datetime.now().isoformat()),
    }
    
    return workflow

def generate_sample_lesson_workflow():
    """
    Generate a sample n8n workflow definition for lesson generation.
    
    Returns:
        dict: The workflow definition
    """
    # This is a simplified example - a real workflow would be more complex
    nodes = [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "lesson-generation",
                "options": {}
            },
            "name": "Webhook",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 1,
            "position": [
                250,
                300
            ]
        },
        {
            "parameters": {
                "functionCode": "// Extract data from webhook\nconst data = $input.item.json;\n\n// Return data for next node\nreturn {\n  json: {\n    language: data.language || 'Spanish',\n    level: data.level || 'beginner',\n    topic: data.topic || 'greetings',\n    user_id: data.user_id\n  }\n};"
            },
            "name": "Process Webhook Data",
            "type": "n8n-nodes-base.function",
            "typeVersion": 1,
            "position": [
                450,
                300
            ]
        },
        {
            "parameters": {
                "url": "http://localhost:5000/api/interactive_lesson",
                "method": "POST",
                "bodyParametersUi": {
                    "parameter": [
                        {
                            "name": "language",
                            "value": "={{ $json.language }}"
                        },
                        {
                            "name": "level",
                            "value": "={{ $json.level }}"
                        },
                        {
                            "name": "topic",
                            "value": "={{ $json.topic }}"
                        },
                        {
                            "name": "task_based",
                            "value": "true"
                        }
                    ]
                },
                "options": {}
            },
            "name": "Generate Lesson",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 1,
            "position": [
                650,
                300
            ]
        },
        {
            "parameters": {
                "functionCode": "// Process the lesson data\nconst lessonData = $input.item.json;\n\n// Format the lesson for email\nconst formattedLesson = `\nLanguage: ${lessonData.lesson.language}\nLevel: ${lessonData.lesson.level}\nTopic: ${lessonData.lesson.topic}\n\n${lessonData.lesson.content}\n`;\n\nreturn {\n  json: {\n    formattedLesson,\n    user_id: $('Process Webhook Data').item.json.user_id,\n    lesson_id: lessonData.lesson.id\n  }\n};"
            },
            "name": "Format Lesson",
            "type": "n8n-nodes-base.function",
            "typeVersion": 1,
            "position": [
                850,
                300
            ]
        },
        {
            "parameters": {
                "fromEmail": "lessons@salud-app.com",
                "toEmail": "={{ $json.user_id }}@example.com",
                "subject": "Your New Language Lesson is Ready!",
                "text": "={{ $json.formattedLesson }}",
                "options": {}
            },
            "name": "Send Email",
            "type": "n8n-nodes-base.emailSend",
            "typeVersion": 1,
            "position": [
                1050,
                300
            ]
        }
    ]
    
    # Define connections between nodes
    connections = {
        "Webhook": {
            "main": [
                [
                    {
                        "node": "Process Webhook Data",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Process Webhook Data": {
            "main": [
                [
                    {
                        "node": "Generate Lesson",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Generate Lesson": {
            "main": [
                [
                    {
                        "node": "Format Lesson",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Format Lesson": {
            "main": [
                [
                    {
                        "node": "Send Email",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    }
    
    workflow = create_n8n_workflow_definition(
        name="Automated Lesson Generation",
        description="Generates a language lesson and emails it to the user",
        nodes=nodes
    )
    
    workflow["connections"] = connections
    
    return workflow

def export_workflow_to_file(workflow, filename):
    """
    Export a workflow definition to a JSON file.
    
    Args:
        workflow (dict): The workflow definition
        filename (str): The filename to save to
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(workflow, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error exporting workflow: {e}")
        return False

# Example usage:
# workflow = generate_sample_lesson_workflow()
# export_workflow_to_file(workflow, 'lesson_workflow.json')
