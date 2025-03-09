import json
import os
import datetime
import re
import openai
from ai_integration.API_Integration import generate_lesson

# Ensure the content directory exists
CONTENT_DIR = os.path.join(os.path.dirname(__file__), 'content')
os.makedirs(CONTENT_DIR, exist_ok=True)

def get_immersion_content(language='Spanish', content_type='article', topic=None, difficulty='intermediate'):
    """
    Get or generate immersion content for language learning.
    
    Args:
        language (str): The target language
        content_type (str): Type of content (article, story, dialogue, etc.)
        topic (str, optional): Specific topic for the content
        difficulty (str): The difficulty level
        
    Returns:
        dict: The immersion content
    """
    # Generate a unique ID for the content
    content_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Create the prompt for the AI
    topic_str = f" about {topic}" if topic else ""
    prompt = f"""
    Generate {difficulty} level {content_type} in {language}{topic_str} for language immersion.
    
    The content should:
    1. Be entirely in {language}
    2. Be appropriate for {difficulty} level learners
    3. Include natural, authentic language usage
    4. Be engaging and culturally relevant
    5. Be between 200-300 words
    
    Also provide:
    - A title in {language}
    - A list of 5-10 key vocabulary words with their translations
    - 3 comprehension questions in {language}
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=800
        )
        
        raw_content = response.choices[0].text.strip()
        
        # Parse the content to extract title, body, vocabulary, and questions
        title_match = re.search(r'^(.+?)(?:\n|$)', raw_content)
        title = title_match.group(1) if title_match else "Untitled Content"
        
        # Create the content object
        content_obj = {
            'id': content_id,
            'title': title,
            'language': language,
            'content_type': content_type,
            'topic': topic,
            'difficulty': difficulty,
            'raw_content': raw_content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Save the content to a file
        filename = f"{content_id}.json"
        filepath = os.path.join(CONTENT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content_obj, f, ensure_ascii=False, indent=2)
        
        return content_obj
    
    except Exception as e:
        print(f"Error generating immersion content: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate immersion content'
        }

def import_external_content(content, title, language='Spanish', content_type='article', source=None):
    """
    Import external content for language immersion.
    
    Args:
        content (str): The content text
        title (str): The title of the content
        language (str): The language of the content
        content_type (str): Type of content (article, news, book excerpt, etc.)
        source (str, optional): Source of the content
        
    Returns:
        dict: The imported content object
    """
    # Generate a unique ID for the content
    content_id = f"imported_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Generate vocabulary and questions using AI
    prompt = f"""
    The following is a {content_type} in {language} titled "{title}".
    
    {content[:500]}...
    
    Based on this content, provide:
    1. A list of 10 key vocabulary words with their translations to English
    2. 5 comprehension questions in {language}
    
    Format your response with clear sections for vocabulary and questions.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=500
        )
        
        ai_additions = response.choices[0].text.strip()
        
        # Create the content object
        content_obj = {
            'id': content_id,
            'title': title,
            'language': language,
            'content_type': content_type,
            'source': source,
            'content': content,
            'ai_additions': ai_additions,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Save the content to a file
        filename = f"{content_id}.json"
        filepath = os.path.join(CONTENT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content_obj, f, ensure_ascii=False, indent=2)
        
        return content_obj
    
    except Exception as e:
        print(f"Error importing content: {e}")
        return {
            'error': str(e),
            'message': 'Failed to import content'
        }

def process_youtube_transcript(transcript_text, video_id, title, language='Spanish'):
    """
    Process a YouTube video transcript for language learning.
    
    Args:
        transcript_text (str): The transcript text
        video_id (str): The YouTube video ID
        title (str): The title of the video
        language (str): The language of the transcript
        
    Returns:
        dict: The processed transcript
    """
    # Generate a unique ID for the content
    content_id = f"youtube_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Generate vocabulary and questions using AI
    prompt = f"""
    The following is a transcript from a YouTube video in {language} titled "{title}".
    
    {transcript_text[:500]}...
    
    Based on this transcript, provide:
    1. A list of 10 key vocabulary words with their translations to English
    2. 5 comprehension questions in {language}
    3. A brief summary of the content in English (2-3 sentences)
    
    Format your response with clear sections for vocabulary, questions, and summary.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=500
        )
        
        ai_additions = response.choices[0].text.strip()
        
        # Create the content object
        content_obj = {
            'id': content_id,
            'title': title,
            'language': language,
            'content_type': 'youtube_transcript',
            'video_id': video_id,
            'transcript': transcript_text,
            'ai_additions': ai_additions,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Save the content to a file
        filename = f"{content_id}.json"
        filepath = os.path.join(CONTENT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content_obj, f, ensure_ascii=False, indent=2)
        
        return content_obj
    
    except Exception as e:
        print(f"Error processing YouTube transcript: {e}")
        return {
            'error': str(e),
            'message': 'Failed to process YouTube transcript'
        }

def get_cultural_immersion_content(language='Spanish', cultural_aspect='traditions', region=None):
    """
    Generate cultural immersion content for language learning.
    
    Args:
        language (str): The target language
        cultural_aspect (str): Aspect of culture (traditions, food, history, etc.)
        region (str, optional): Specific region or country
        
    Returns:
        dict: The cultural immersion content
    """
    # Generate a unique ID for the content
    content_id = f"cultural_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Create the prompt for the AI
    region_str = f" in {region}" if region else ""
    prompt = f"""
    Generate cultural immersion content about {cultural_aspect} {region_str} for students learning {language}.
    
    Include:
    1. A title in {language}
    2. An engaging description of the {cultural_aspect} (200-300 words) in {language}
    3. Cultural vocabulary (10 terms with translations)
    4. Cultural insights and context
    5. How this cultural aspect relates to the language
    6. A short activity or reflection question for students
    
    Format the response in a structured way with clear section headings.
    """
    
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=800
        )
        
        content = response.choices[0].text.strip()
        
        # Parse the title
        title_match = re.search(r'^(.+?)(?:\n|$)', content)
        title = title_match.group(1) if title_match else "Cultural Immersion"
        
        # Create the content object
        content_obj = {
            'id': content_id,
            'title': title,
            'language': language,
            'cultural_aspect': cultural_aspect,
            'region': region,
            'content': content,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Save the content to a file
        filename = f"{content_id}.json"
        filepath = os.path.join(CONTENT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content_obj, f, ensure_ascii=False, indent=2)
        
        return content_obj
    
    except Exception as e:
        print(f"Error generating cultural content: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate cultural content'
        }
