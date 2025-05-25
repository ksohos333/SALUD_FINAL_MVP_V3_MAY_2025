import json
import os
import datetime
import re
from openai import OpenAI
from ai_integration.API_Integration import generate_lesson

# Use in-memory storage for Vercel deployment
# Check if running on Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'

# In-memory storage for content when on Vercel
CONTENT_MEMORY = {}

# Local directory for content when running locally
CONTENT_DIR = os.path.join(os.path.dirname(__file__), 'content')
if not IS_VERCEL:
    os.makedirs(CONTENT_DIR, exist_ok=True)

# Initialize OpenAI client
client = OpenAI()

def get_immersion_content(language='Spanish', content_type=None, topic=None, difficulty=None):
    """
    Get or generate immersion content for language learning.
    
    Args:
        language (str): The target language
        content_type (str): Type of content (article, story, dialogue, etc.)
        topic (str, optional): Specific topic for the content
        difficulty (str): The difficulty level
        
    Returns:
        list: List of immersion content items
    """
    # For testing purposes, return mock content
    mock_content = get_mock_content_list(language)
    
    # Filter by content type if provided
    if content_type and content_type != 'all':
        mock_content = [item for item in mock_content if item['type'] == content_type]
    
    # Filter by topic if provided
    if topic and topic != 'all':
        mock_content = [item for item in mock_content if item['topic'] == topic]
    
    # Filter by difficulty if provided
    if difficulty and difficulty != 'all':
        mock_content = [item for item in mock_content if item['level'] == difficulty]
    
    # If no mock content matches or if we want to generate new content
    if not mock_content or (not content_type and not topic and not difficulty):
        try:
            # Generate a unique ID for the content
            content_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            
            # Create the prompt for the AI
            topic_str = f" about {topic}" if topic else ""
            difficulty_level = difficulty if difficulty else 'intermediate'
            content_type_str = content_type if content_type and content_type != 'all' else 'article'
            
            prompt = f"""
            Generate {difficulty_level} level {content_type_str} in {language}{topic_str} for language immersion.
            
            The content should:
            1. Be entirely in {language}
            2. Be appropriate for {difficulty_level} level learners
            3. Include natural, authentic language usage
            4. Be engaging and culturally relevant
            5. Be between 200-300 words
            
            Also provide:
            - A title in {language}
            - A list of 5-10 key vocabulary words with their translations
            - 3 comprehension questions in {language}
            """
            
            response = client.completions.create(
                model="gpt-3.5-turbo-instruct",  # Updated model name
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
                'type': content_type_str,
                'level': difficulty_level,
                'topic': topic if topic else 'general',
                'language': language,
                'thumbnail': 'https://via.placeholder.com/300x200',
                'description': f"AI-generated {content_type_str} in {language} for {difficulty_level} level learners",
                'duration': '5 min read',
                'content': raw_content,
                'progress': 0
            }
            
            if IS_VERCEL:
                # Store in memory when on Vercel
                CONTENT_MEMORY[content_id] = content_obj
            else:
                # Save the content to a file when running locally
                filename = f"{content_id}.json"
                filepath = os.path.join(CONTENT_DIR, filename)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(content_obj, f, ensure_ascii=False, indent=2)
            
            # Add the new content to the list
            mock_content.append(content_obj)
            
        except Exception as e:
            print(f"Error generating immersion content: {e}")
            # If generation fails, just return the filtered mock content
    
    return mock_content

def get_mock_content_list(language='Spanish'):
    """
    Get a list of mock content for testing purposes.
    
    Args:
        language (str): The language to filter by
        
    Returns:
        list: List of mock content items
    """
    mock_content = [
        {
            'id': '1',
            'title': 'Un día en Madrid',
            'type': 'articles',
            'level': 'beginner',
            'topic': 'travel',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Explore the beautiful city of Madrid through this easy-to-read article about the main attractions.',
            'duration': '5 min read',
            'content': """
              <h2>Un día en Madrid</h2>
              <p>Madrid es la capital de España. Es una ciudad grande y hermosa. Hay muchos lugares interesantes para visitar.</p>
              <p>Por la mañana, puedes visitar el Museo del Prado. Es uno de los museos de arte más importantes del mundo. Después, puedes caminar por el Parque del Retiro. Es un parque grande y bonito en el centro de la ciudad.</p>
              <p>Para el almuerzo, puedes comer tapas en un restaurante típico. Las tapas son pequeños platos de comida española. Son muy deliciosas.</p>
              <p>Por la tarde, puedes visitar el Palacio Real. Es la residencia oficial del Rey de España. También puedes ir a la Plaza Mayor. Es una plaza histórica con muchos cafés y restaurantes.</p>
              <p>Por la noche, puedes disfrutar de la vida nocturna de Madrid. Hay muchos bares y discotecas. También puedes ver un espectáculo de flamenco.</p>
              <p>Madrid es una ciudad que nunca duerme. ¡Hay tantas cosas que hacer!</p>
            """,
            'vocabulary': [
              { 'word': 'capital', 'translation': 'capital', 'notes': 'Same spelling as in English, but pronounced differently' },
              { 'word': 'hermosa', 'translation': 'beautiful', 'notes': 'Feminine form of "hermoso"' },
              { 'word': 'por la mañana', 'translation': 'in the morning', 'notes': 'Time expression' },
              { 'word': 'tapas', 'translation': 'small dishes', 'notes': 'Traditional Spanish appetizers' },
              { 'word': 'vida nocturna', 'translation': 'nightlife', 'notes': 'Compound noun' }
            ],
            'progress': 0
        },
        {
            'id': '2',
            'title': 'Cocina Española: Paella Valenciana',
            'type': 'videos',
            'level': 'intermediate',
            'topic': 'food',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Learn how to cook authentic Spanish paella with this step-by-step video guide.',
            'duration': '12 min video',
            'content': 'https://www.youtube.com/embed/dMfFkLGRTi0',
            'vocabulary': [
              { 'word': 'arroz', 'translation': 'rice', 'notes': 'Main ingredient in paella' },
              { 'word': 'azafrán', 'translation': 'saffron', 'notes': 'Expensive spice that gives paella its color' },
              { 'word': 'mariscos', 'translation': 'seafood', 'notes': 'Collective noun' },
              { 'word': 'hervir', 'translation': 'to boil', 'notes': 'Regular -ir verb' },
              { 'word': 'fuego lento', 'translation': 'low heat', 'notes': 'Cooking term' }
            ],
            'progress': 0
        },
        {
            'id': '3',
            'title': 'Historia de la Música Latina',
            'type': 'podcasts',
            'level': 'advanced',
            'topic': 'culture',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'A deep dive into the rich history of Latin music and its influence around the world.',
            'duration': '25 min podcast',
            'content': 'https://open.spotify.com/embed/episode/5V4XZWGZwreKTLrI3hQkB5',
            'vocabulary': [
              { 'word': 'influencia', 'translation': 'influence', 'notes': 'Similar to English' },
              { 'word': 'ritmo', 'translation': 'rhythm', 'notes': 'Musical term' },
              { 'word': 'fusión', 'translation': 'fusion', 'notes': 'Blending of musical styles' },
              { 'word': 'patrimonio cultural', 'translation': 'cultural heritage', 'notes': 'Important cultural concept' },
              { 'word': 'género musical', 'translation': 'music genre', 'notes': 'Classification of music' }
            ],
            'progress': 0
        },
        {
            'id': '4',
            'title': 'Noticias Fáciles',
            'type': 'articles',
            'level': 'beginner',
            'topic': 'news',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Current news written in simple Spanish, perfect for beginners.',
            'duration': '3 min read',
            'content': """
              <h2>Noticias Fáciles</h2>
              <h3>El clima está cambiando</h3>
              <p>Los científicos dicen que el clima del mundo está cambiando. Hace más calor que antes. Los veranos son más calientes y los inviernos son menos fríos.</p>
              <p>Este cambio afecta a muchos animales. Algunos animales no pueden vivir en lugares donde hace mucho calor. Tienen que moverse a otros lugares.</p>
              <p>Las personas también sienten el cambio. En muchas ciudades, hace más calor en el verano. Es importante beber mucha agua y protegerse del sol.</p>
              <h3>Nueva película popular</h3>
              <p>Una nueva película de superhéroes es muy popular. Muchas personas van al cine para verla. La película cuenta la historia de un héroe que salva su ciudad.</p>
              <p>Los actores de la película son famosos. La música y los efectos especiales son muy buenos. Muchas personas dicen que es la mejor película del año.</p>
            """,
            'vocabulary': [
              { 'word': 'científicos', 'translation': 'scientists', 'notes': 'Plural noun' },
              { 'word': 'clima', 'translation': 'climate', 'notes': 'Environmental term' },
              { 'word': 'afecta', 'translation': 'affects', 'notes': 'From the verb "afectar"' },
              { 'word': 'protegerse', 'translation': 'to protect oneself', 'notes': 'Reflexive verb' },
              { 'word': 'efectos especiales', 'translation': 'special effects', 'notes': 'Film industry term' }
            ],
            'progress': 0
        }
    ]
    
    # Filter by language if needed
    if language != 'all':
        mock_content = [item for item in mock_content if item['language'] == language]
    
    return mock_content

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
        response = client.completions.create(
            model="gpt-3.5-turbo-instruct",  # Updated model name
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
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            CONTENT_MEMORY[content_id] = content_obj
        else:
            # Save the content to a file when running locally
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
        response = client.completions.create(
            model="gpt-3.5-turbo-instruct",  # Updated model name
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
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            CONTENT_MEMORY[content_id] = content_obj
        else:
            # Save the content to a file when running locally
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

def get_content_by_id(content_id):
    """
    Retrieve content by its ID.
    
    Args:
        content_id (int or str): The ID of the content to retrieve
        
    Returns:
        dict: The content object or None if not found
    """
    # Convert to string if it's an integer
    content_id = str(content_id)
    
    try:
        if IS_VERCEL:
            # Retrieve from memory when on Vercel
            return CONTENT_MEMORY.get(content_id)
        else:
            # Check if we have mock content for testing
            if content_id in ['1', '2', '3', '4']:
                return get_mock_content(content_id)
                
            # Try to retrieve from file when running locally
            for filename in os.listdir(CONTENT_DIR):
                if filename.startswith(content_id) or content_id in filename:
                    filepath = os.path.join(CONTENT_DIR, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        return json.load(f)
            
            # If not found, return None
            return None
    
    except Exception as e:
        print(f"Error retrieving content by ID: {e}")
        return None

def get_mock_content(content_id):
    """
    Get mock content for testing purposes.
    
    Args:
        content_id (str): The ID of the mock content
        
    Returns:
        dict: The mock content object
    """
    mock_content = {
        '1': {
            'id': 1,
            'title': 'Un día en Madrid',
            'type': 'articles',
            'level': 'beginner',
            'topic': 'travel',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Explore the beautiful city of Madrid through this easy-to-read article about the main attractions.',
            'duration': '5 min read',
            'content': """
              <h2>Un día en Madrid</h2>
              <p>Madrid es la capital de España. Es una ciudad grande y hermosa. Hay muchos lugares interesantes para visitar.</p>
              <p>Por la mañana, puedes visitar el Museo del Prado. Es uno de los museos de arte más importantes del mundo. Después, puedes caminar por el Parque del Retiro. Es un parque grande y bonito en el centro de la ciudad.</p>
              <p>Para el almuerzo, puedes comer tapas en un restaurante típico. Las tapas son pequeños platos de comida española. Son muy deliciosas.</p>
              <p>Por la tarde, puedes visitar el Palacio Real. Es la residencia oficial del Rey de España. También puedes ir a la Plaza Mayor. Es una plaza histórica con muchos cafés y restaurantes.</p>
              <p>Por la noche, puedes disfrutar de la vida nocturna de Madrid. Hay muchos bares y discotecas. También puedes ver un espectáculo de flamenco.</p>
              <p>Madrid es una ciudad que nunca duerme. ¡Hay tantas cosas que hacer!</p>
            """,
            'vocabulary': [
              { 'word': 'capital', 'translation': 'capital', 'notes': 'Same spelling as in English, but pronounced differently' },
              { 'word': 'hermosa', 'translation': 'beautiful', 'notes': 'Feminine form of "hermoso"' },
              { 'word': 'por la mañana', 'translation': 'in the morning', 'notes': 'Time expression' },
              { 'word': 'tapas', 'translation': 'small dishes', 'notes': 'Traditional Spanish appetizers' },
              { 'word': 'vida nocturna', 'translation': 'nightlife', 'notes': 'Compound noun' }
            ],
            'progress': 0
        },
        '2': {
            'id': 2,
            'title': 'Cocina Española: Paella Valenciana',
            'type': 'videos',
            'level': 'intermediate',
            'topic': 'food',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Learn how to cook authentic Spanish paella with this step-by-step video guide.',
            'duration': '12 min video',
            'content': 'https://www.youtube.com/embed/dMfFkLGRTi0',
            'vocabulary': [
              { 'word': 'arroz', 'translation': 'rice', 'notes': 'Main ingredient in paella' },
              { 'word': 'azafrán', 'translation': 'saffron', 'notes': 'Expensive spice that gives paella its color' },
              { 'word': 'mariscos', 'translation': 'seafood', 'notes': 'Collective noun' },
              { 'word': 'hervir', 'translation': 'to boil', 'notes': 'Regular -ir verb' },
              { 'word': 'fuego lento', 'translation': 'low heat', 'notes': 'Cooking term' }
            ],
            'progress': 0
        },
        '3': {
            'id': 3,
            'title': 'Historia de la Música Latina',
            'type': 'podcasts',
            'level': 'advanced',
            'topic': 'culture',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'A deep dive into the rich history of Latin music and its influence around the world.',
            'duration': '25 min podcast',
            'content': 'https://open.spotify.com/embed/episode/5V4XZWGZwreKTLrI3hQkB5',
            'vocabulary': [
              { 'word': 'influencia', 'translation': 'influence', 'notes': 'Similar to English' },
              { 'word': 'ritmo', 'translation': 'rhythm', 'notes': 'Musical term' },
              { 'word': 'fusión', 'translation': 'fusion', 'notes': 'Blending of musical styles' },
              { 'word': 'patrimonio cultural', 'translation': 'cultural heritage', 'notes': 'Important cultural concept' },
              { 'word': 'género musical', 'translation': 'music genre', 'notes': 'Classification of music' }
            ],
            'progress': 0
        },
        '4': {
            'id': 4,
            'title': 'Noticias Fáciles',
            'type': 'articles',
            'level': 'beginner',
            'topic': 'news',
            'language': 'Spanish',
            'thumbnail': 'https://via.placeholder.com/300x200',
            'description': 'Current news written in simple Spanish, perfect for beginners.',
            'duration': '3 min read',
            'content': """
              <h2>Noticias Fáciles</h2>
              <h3>El clima está cambiando</h3>
              <p>Los científicos dicen que el clima del mundo está cambiando. Hace más calor que antes. Los veranos son más calientes y los inviernos son menos fríos.</p>
              <p>Este cambio afecta a muchos animales. Algunos animales no pueden vivir en lugares donde hace mucho calor. Tienen que moverse a otros lugares.</p>
              <p>Las personas también sienten el cambio. En muchas ciudades, hace más calor en el verano. Es importante beber mucha agua y protegerse del sol.</p>
              <h3>Nueva película popular</h3>
              <p>Una nueva película de superhéroes es muy popular. Muchas personas van al cine para verla. La película cuenta la historia de un héroe que salva su ciudad.</p>
              <p>Los actores de la película son famosos. La música y los efectos especiales son muy buenos. Muchas personas dicen que es la mejor película del año.</p>
            """,
            'vocabulary': [
              { 'word': 'científicos', 'translation': 'scientists', 'notes': 'Plural noun' },
              { 'word': 'clima', 'translation': 'climate', 'notes': 'Environmental term' },
              { 'word': 'afecta', 'translation': 'affects', 'notes': 'From the verb "afectar"' },
              { 'word': 'protegerse', 'translation': 'to protect oneself', 'notes': 'Reflexive verb' },
              { 'word': 'efectos especiales', 'translation': 'special effects', 'notes': 'Film industry term' }
            ],
            'progress': 0
        }
    }
    
    return mock_content.get(content_id)

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
        response = client.completions.create(
            model="gpt-3.5-turbo-instruct",  # Updated model name
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
        
        if IS_VERCEL:
            # Store in memory when on Vercel
            CONTENT_MEMORY[content_id] = content_obj
        else:
            # Save the content to a file when running locally
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
