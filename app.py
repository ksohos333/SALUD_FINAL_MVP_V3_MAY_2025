from flask import Flask, request, jsonify, render_template, send_from_directory, url_for, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import login_required, current_user
import os
import json
import secrets
import datetime
from dotenv import load_dotenv

# Import module functions
from ai_integration.API_Integration import generate_lesson
from journaling.journal import create_journal_entry, get_journal_entries
from writing_exercises.exercises import generate_writing_exercise, check_writing, get_typing_exercise
from lessons.lesson_generator import generate_interactive_lesson, generate_subject_based_lesson, get_recent_lessons
from immersion.content import get_immersion_content, import_external_content, process_youtube_transcript, get_cultural_immersion_content
from ai_integration.n8n_integration import (
    trigger_lesson_workflow, 
    trigger_journal_feedback_workflow, 
    trigger_writing_feedback_workflow,
    generate_sample_lesson_workflow,
    export_workflow_to_file
)

# Import authentication and database models
from models import db, User, SavedWord, JournalEntry, Lesson, LessonProgress, LearningPhase, ImmersionSession, ContentSource
from auth import auth_bp, login_manager, mail

# Import subscription module
from subscriptions import init_app as init_subscription

# Load environment variables
load_dotenv('ai_integration/ai_integration.env')

# Create Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')
# Enable CORS for all routes with specific settings for the Next.js frontend
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3001"], "supports_credentials": True, "allow_headers": ["Content-Type", "Authorization"], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

# Add CORS preflight handler for OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(16))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///salud.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@salud.com')

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
login_manager.init_app(app)
mail.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')

# Initialize subscription module
init_subscription(app)

# Create database tables
@app.before_first_request
def create_tables():
    db.create_all()

# Frontend Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/profile')
def profile():
    return redirect(url_for('auth.profile'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/flask/lessons')
@login_required
def lessons():
    return render_template('lessons.html')

@app.route('/flask/journal')
@login_required
def journal():
    return render_template('journal.html')

@app.route('/writing')
@login_required
def writing():
    return render_template('writing.html')

@app.route('/flask/immersion')
@login_required
def immersion():
    return render_template('immersion.html')

@app.route('/typing')
@login_required
def typing():
    return render_template('writing.html', active_tab='typing')

@app.route('/youtube')
@login_required
def youtube():
    return render_template('immersion.html', active_tab='youtube')

@app.route('/import')
@login_required
def import_content():
    return render_template('immersion.html', active_tab='import')

@app.route('/pricing')
def pricing():
    # Redirect to subscription plans page
    return redirect(url_for('subscription.plans'))

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/flask/vocabulary')
@login_required
def vocabulary():
    return render_template('vocabulary.html')

@app.route('/achievements')
@login_required
def achievements():
    return render_template('achievements.html')

@app.route('/v0-page')
@login_required
def v0_page():
    return render_template('v0_page.html')

# API Routes

# Learning Phase Routes
@app.route('/api/learning_phase', methods=['GET'])
def get_learning_phase():
    """Get the current user's learning phase"""
    # For testing purposes, return mock data
    learning_phase = {
        'id': 1,
        'user_id': 1,
        'phase_type': 'immersion',
        'immersion_hours': 12.5,
        'target_immersion_hours': 20,
        'is_ready_for_output': False,
        'created_at': '2025-03-28T10:00:00Z',
        'updated_at': '2025-03-28T10:00:00Z'
    }
    
    return jsonify({
        'success': True,
        'learning_phase': learning_phase
    })

@app.route('/api/learning_phase/update', methods=['POST'])
@login_required
def update_learning_phase():
    """Update the user's learning phase"""
    data = request.json
    
    # Get the user's learning phase
    learning_phase = LearningPhase.query.filter_by(user_id=current_user.id).first()
    
    # If not found, create a new one
    if not learning_phase:
        learning_phase = LearningPhase(user_id=current_user.id)
        db.session.add(learning_phase)
    
    # Update fields if provided
    if 'phase_type' in data:
        learning_phase.phase_type = data['phase_type']
    
    if 'target_immersion_hours' in data:
        learning_phase.target_immersion_hours = data['target_immersion_hours']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'learning_phase': learning_phase.to_dict()
    })

@app.route('/api/learning_phase/advance', methods=['POST'])
@login_required
def advance_learning_phase():
    """Advance the user from immersion to output phase"""
    # Get the user's learning phase
    learning_phase = LearningPhase.query.filter_by(user_id=current_user.id).first()
    
    # Check if the user is ready to advance
    if not learning_phase or not learning_phase.is_ready_for_output():
        return jsonify({
            'success': False,
            'message': 'User has not completed enough immersion hours to advance to output phase'
        }), 400
    
    # Update the phase type
    learning_phase.phase_type = 'output'
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Advanced to output phase',
        'learning_phase': learning_phase.to_dict()
    })

# Immersion Session Routes
@app.route('/api/immersion_sessions', methods=['GET'])
def get_immersion_sessions():
    """Get the user's immersion sessions"""
    # For testing purposes, return mock data
    sessions = [
        {
            'id': 1,
            'user_id': 1,
            'content_source_id': None,
            'session_type': 'listening',
            'duration_minutes': 45,
            'notes': 'Listened to Spanish podcast about cooking',
            'created_at': '2025-03-25T14:30:00Z'
        },
        {
            'id': 2,
            'user_id': 1,
            'content_source_id': None,
            'session_type': 'reading',
            'duration_minutes': 30,
            'notes': 'Read a short story in Spanish',
            'created_at': '2025-03-26T10:15:00Z'
        },
        {
            'id': 3,
            'user_id': 1,
            'content_source_id': None,
            'session_type': 'watching',
            'duration_minutes': 60,
            'notes': 'Watched a Spanish movie with subtitles',
            'created_at': '2025-03-27T20:00:00Z'
        }
    ]
    
    # Calculate total hours
    total_hours = sum(session['duration_minutes'] / 60 for session in sessions)
    
    return jsonify({
        'success': True,
        'sessions': sessions,
        'total_hours': total_hours,
        'count': len(sessions)
    })

@app.route('/api/immersion_sessions', methods=['POST'])
@login_required
def create_immersion_session():
    """Create a new immersion session"""
    data = request.json
    
    # Validate required fields
    if 'duration_minutes' not in data or 'session_type' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing required fields: duration_minutes, session_type'
        }), 400
    
    # Create new session
    session = ImmersionSession(
        user_id=current_user.id,
        content_source_id=data.get('content_source_id'),
        duration_minutes=data['duration_minutes'],
        session_type=data['session_type'],
        notes=data.get('notes')
    )
    
    db.session.add(session)
    
    # Update the user's learning phase with the new immersion time
    learning_phase = LearningPhase.query.filter_by(user_id=current_user.id).first()
    
    if not learning_phase:
        learning_phase = LearningPhase(user_id=current_user.id, immersion_hours=0.0)
        db.session.add(learning_phase)
    
    # Add the session time to the total immersion hours
    if learning_phase.immersion_hours is None:
        learning_phase.immersion_hours = 0.0
    learning_phase.immersion_hours += session.duration_minutes / 60
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'session': session.to_dict(),
        'learning_phase': learning_phase.to_dict()
    })

# Vocabulary System Routes
@app.route('/api/vocabulary/save', methods=['POST'])
@login_required
def save_word():
    data = request.json
    
    # Check if word already exists for this user
    existing_word = SavedWord.query.filter_by(
        user_id=current_user.id,
        word=data.get('word'),
        language=data.get('language')
    ).first()
    
    if existing_word:
        # Update existing word
        existing_word.context = data.get('context', existing_word.context)
        existing_word.translation = data.get('translation', existing_word.translation)
        existing_word.notes = data.get('notes', existing_word.notes)
        existing_word.word_type = data.get('word_type', existing_word.word_type)
        
        if data.get('tags'):
            existing_word.tags = data.get('tags')
            
        if data.get('source_content_id'):
            existing_word.source_content_id = data.get('source_content_id')
            
        db.session.commit()
        return jsonify({'success': True, 'word': existing_word.to_dict(), 'updated': True})
    
    # Create new word
    word = SavedWord(
        user_id=current_user.id,
        word=data.get('word'),
        context=data.get('context'),
        language=data.get('language'),
        translation=data.get('translation'),
        notes=data.get('notes'),
        word_type=data.get('word_type'),
        tags=data.get('tags', []),
        source_content_id=data.get('source_content_id'),
        familiarity_level=0  # New word starts at level 0
    )
    db.session.add(word)
    db.session.commit()
    
    return jsonify({'success': True, 'word': word.to_dict(), 'created': True})

@app.route('/api/vocabulary', methods=['GET'])
@login_required
def get_vocabulary():
    # Get filter parameters
    language = request.args.get('language')
    word_type = request.args.get('word_type')
    familiarity = request.args.get('familiarity')
    search = request.args.get('search')
    
    # Build query
    query = SavedWord.query.filter_by(user_id=current_user.id)
    
    if language:
        query = query.filter_by(language=language)
        
    if word_type:
        query = query.filter_by(word_type=word_type)
        
    if familiarity:
        if familiarity == 'new':
            query = query.filter_by(familiarity_level=0)
        elif familiarity == 'learning':
            query = query.filter(SavedWord.familiarity_level > 0, SavedWord.familiarity_level < 5)
        elif familiarity == 'mastered':
            query = query.filter_by(familiarity_level=5)
            
    if search:
        query = query.filter(SavedWord.word.ilike(f'%{search}%'))
    
    # Get words
    words = query.order_by(SavedWord.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'words': [word.to_dict() for word in words],
        'stats': {
            'total': SavedWord.query.filter_by(user_id=current_user.id).count(),
            'new': SavedWord.query.filter_by(user_id=current_user.id, familiarity_level=0).count(),
            'learning': SavedWord.query.filter(
                SavedWord.user_id == current_user.id,
                SavedWord.familiarity_level > 0,
                SavedWord.familiarity_level < 5
            ).count(),
            'mastered': SavedWord.query.filter_by(user_id=current_user.id, familiarity_level=5).count()
        }
    })

@app.route('/api/vocabulary/flashcards', methods=['GET'])
@login_required
def get_flashcards():
    # Implement spaced repetition algorithm
    today = datetime.datetime.utcnow()
    
    # Get words due for review or new words
    words = SavedWord.query.filter(
        SavedWord.user_id == current_user.id,
        db.or_(
            SavedWord.next_review_date <= today,
            SavedWord.next_review_date == None,
            SavedWord.familiarity_level == 0
        )
    ).order_by(
        # Prioritize words due for review, then new words
        db.case(
            (SavedWord.next_review_date != None, 0),
            else_=1
        ),
        SavedWord.familiarity_level,
        SavedWord.created_at
    ).limit(20).all()
    
    return jsonify({
        'success': True,
        'flashcards': [word.to_dict() for word in words]
    })

@app.route('/api/vocabulary/update_familiarity', methods=['POST'])
@login_required
def update_familiarity():
    data = request.json
    word_id = data.get('word_id')
    knew_answer = data.get('knew_answer', False)
    
    word = SavedWord.query.filter_by(id=word_id, user_id=current_user.id).first()
    if not word:
        return jsonify({'success': False, 'message': 'Word not found'}), 404
    
    # Update familiarity level based on user's response
    if knew_answer:
        # Increase familiarity (max 5)
        word.familiarity_level = min(5, word.familiarity_level + 1)
    else:
        # Decrease familiarity (min 0)
        word.familiarity_level = max(0, word.familiarity_level - 1)
    
    # Calculate next review date using spaced repetition
    intervals = [1, 3, 7, 14, 30, 90]  # Days between reviews based on familiarity level
    if word.familiarity_level > 0:
        days = intervals[min(word.familiarity_level - 1, len(intervals) - 1)]
        word.next_review_date = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    else:
        # For level 0, review tomorrow
        word.next_review_date = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    
    word.last_reviewed = datetime.datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'word': word.to_dict(),
        'next_review': word.next_review_date.isoformat() if word.next_review_date else None
    })

@app.route('/api/vocabulary/translate', methods=['POST'])
@login_required
def translate_word():
    data = request.json
    word = data.get('word')
    context = data.get('context')
    language = data.get('language', 'Spanish')
    
    # Use OpenAI to translate and analyze the word
    prompt = f"""
    Translate and analyze the following word or phrase from {language} to English:
    
    Word/Phrase: "{word}"
    Context: "{context}"
    
    Provide:
    1. Translation
    2. Word type (noun, verb, adjective, adverb, phrase, other)
    3. Brief notes about usage or connotations
    
    Format your response as JSON:
    {{
        "translation": "English translation",
        "word_type": "part of speech",
        "notes": "brief usage notes"
    }}
    """
    
    try:
        # Call OpenAI API
        from ai_integration.API_Integration import generate_response
        response = generate_response(prompt)
        
        # Parse JSON response
        import json
        result = json.loads(response)
        
        return jsonify({
            'success': True,
            'translation': result.get('translation'),
            'word_type': result.get('word_type'),
            'notes': result.get('notes')
        })
    except Exception as e:
        print(f"Error translating word: {e}")
        return jsonify({
            'success': False,
            'message': 'Error translating word'
        }), 500

# Content Source Routes
@app.route('/api/content/sources', methods=['GET'])
@login_required
def get_content_sources():
    # Get filter parameters
    language = request.args.get('language')
    content_type = request.args.get('content_type')
    
    # Build query
    query = ContentSource.query.filter_by(user_id=current_user.id)
    
    if language:
        query = query.filter_by(language=language)
        
    if content_type:
        query = query.filter_by(content_type=content_type)
    
    # Get content sources
    sources = query.order_by(ContentSource.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'sources': [source.to_dict() for source in sources]
    })

@app.route('/api/content/source/<int:source_id>', methods=['GET'])
@login_required
def get_content_source(source_id):
    source = ContentSource.query.filter_by(id=source_id, user_id=current_user.id).first()
    
    if not source:
        return jsonify({'success': False, 'message': 'Content source not found'}), 404
    
    # Get words associated with this content source
    words = SavedWord.query.filter_by(source_content_id=source_id).all()
    
    return jsonify({
        'success': True,
        'source': source.to_dict(),
        'content': source.content,
        'words': [word.to_dict() for word in words]
    })

@app.route('/api/content/source', methods=['POST'])
@login_required
def create_content_source():
    data = request.json
    
    source = ContentSource(
        user_id=current_user.id,
        title=data.get('title'),
        content_type=data.get('content_type'),
        content=data.get('content'),
        language=data.get('language'),
        source_url=data.get('source_url')
    )
    
    db.session.add(source)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'source': source.to_dict()
    })

# Basic Lesson Generation (using OpenAI directly)
@app.route('/api/generate_lesson', methods=['POST'])
@login_required
def api_generate_lesson():
    data = request.json
    language = data.get('language', 'Spanish')
    level = data.get('level', 'beginner')
    topic = data.get('topic', 'greetings')
    
    prompt = f"Generate an interactive language lesson for {level} level students in {language} about {topic}."
    lesson_content = generate_lesson(prompt)
    
    return jsonify({
        'success': True,
        'lesson': lesson_content
    })

# Interactive Lesson Generation
@app.route('/api/interactive_lesson', methods=['POST'])
@login_required
def interactive_lesson_api():
    data = request.json
    lesson = generate_interactive_lesson(
        language=data.get('language', 'Spanish'),
        level=data.get('level', 'beginner'),
        topic=data.get('topic', 'greetings'),
        task_based=data.get('task_based', True)
    )
    return jsonify({'success': True, 'lesson': lesson})

# Subject-Based Lesson Generation
@app.route('/api/subject_lesson', methods=['POST'])
@login_required
def subject_lesson_api():
    data = request.json
    lesson = generate_subject_based_lesson(
        language=data.get('language', 'Spanish'),
        level=data.get('level', 'beginner'),
        subject=data.get('subject', 'mathematics'),
        topic=data.get('topic', 'basic arithmetic')
    )
    return jsonify({'success': True, 'lesson': lesson})

# Get Recent Lessons
@app.route('/api/lessons', methods=['GET'])
def get_lessons_api():
    limit = request.args.get('limit', 10, type=int)
    # Remove login_required for testing
    try:
        lessons = get_recent_lessons(limit)
        return jsonify({'success': True, 'lessons': lessons})
    except Exception as e:
        print(f"Error fetching lessons: {e}")
        # Return mock data for testing
        mock_lessons = [
            {
                'id': '1',
                'title': 'Basic Greetings',
                'language': 'Spanish',
                'level': 'Beginner',
                'description': 'Learn common greetings and introductions in Spanish.',
                'created_at': '2025-05-20T10:00:00Z'
            },
            {
                'id': '2',
                'title': 'Food and Dining',
                'language': 'Spanish',
                'level': 'Beginner',
                'description': 'Vocabulary and phrases for ordering food and dining out.',
                'created_at': '2025-05-21T14:30:00Z'
            }
        ]
        return jsonify({'success': True, 'lessons': mock_lessons})

# Add a direct endpoint for lessons without api prefix for frontend compatibility
@app.route('/lessons', methods=['GET'])
def get_lessons_direct():
    return get_lessons_api()

# Get Lesson by ID
@app.route('/api/lessons/<lesson_id>', methods=['GET'])
@login_required
def get_lesson_by_id_api(lesson_id):
    from lessons.lesson_generator import get_lesson_by_id
    lesson = get_lesson_by_id(lesson_id)
    if not lesson:
        return jsonify({'success': False, 'message': 'Lesson not found'}), 404
    return jsonify({'success': True, 'lesson': lesson})

# Journal Entry
@app.route('/api/journal', methods=['POST', 'GET'])
@login_required
def journal_api():
    if request.method == 'POST':
        data = request.json
        entry = create_journal_entry(data.get('content'), data.get('language', 'Spanish'))
        return jsonify({'success': True, 'entry': entry})
    else:
        entries = get_journal_entries()
        return jsonify({'success': True, 'entries': entries})

# Writing Exercise
@app.route('/api/writing_exercise', methods=['POST'])
@login_required
def writing_exercise_api():
    data = request.json
    exercise = generate_writing_exercise(
        language=data.get('language', 'Spanish'),
        level=data.get('level', 'beginner'),
        topic=data.get('topic')
    )
    return jsonify({'success': True, 'exercise': exercise})

# Check Writing
@app.route('/api/check_writing', methods=['POST'])
@login_required
def check_writing_api():
    data = request.json
    feedback = check_writing(
        content=data.get('content'),
        language=data.get('language', 'Spanish'),
        exercise_id=data.get('exercise_id')
    )
    return jsonify({'success': True, 'feedback': feedback})

# Typing Exercise
@app.route('/api/typing_exercise', methods=['GET'])
@login_required
def typing_exercise_api():
    language = request.args.get('language', 'Spanish')
    script_type = request.args.get('script_type', 'standard')
    difficulty = request.args.get('difficulty', 'beginner')
    
    exercise = get_typing_exercise(language, script_type, difficulty)
    return jsonify({'success': True, 'exercise': exercise})

# Immersion Content
@app.route('/api/immersion_content', methods=['GET'])
@login_required
def immersion_content_api():
    language = request.args.get('language', 'Spanish')
    content_type = request.args.get('type')
    topic = request.args.get('topic')
    difficulty = request.args.get('difficulty')
    bookmarked = request.args.get('bookmarked') == 'true'
    
    # Get user's bookmarks if needed for filtering
    user_bookmarks = []
    if bookmarked:
        # Get user's bookmarked content IDs from database
        # This is a placeholder - implement based on your database model
        from models import ContentBookmark
        bookmarks = ContentBookmark.query.filter_by(user_id=current_user.id).all()
        user_bookmarks = [bookmark.content_id for bookmark in bookmarks]
    
    content = get_immersion_content(language, content_type, topic, difficulty)
    
    # Filter by bookmarks if requested
    if bookmarked:
        content = [item for item in content if item.get('id') in user_bookmarks]
    
    # Include bookmark information in response
    return jsonify({
        'success': True, 
        'content': content,
        'bookmarks': user_bookmarks
    })

# Get content by ID
@app.route('/api/content/<int:content_id>', methods=['GET'])
@login_required
def get_content_by_id(content_id):
    # Fetch content from database or content service
    # This is a placeholder - implement based on your database model
    from immersion.content import get_content_by_id
    
    try:
        content = get_content_by_id(content_id)
        if not content:
            return jsonify({'success': False, 'message': 'Content not found'}), 404
            
        # Check if content is bookmarked by user
        from models import ContentBookmark
        is_bookmarked = ContentBookmark.query.filter_by(
            user_id=current_user.id, 
            content_id=content_id
        ).first() is not None
        
        # Get content progress
        from models import ContentProgress
        progress = ContentProgress.query.filter_by(
            user_id=current_user.id,
            content_id=content_id
        ).first()
        
        progress_value = progress.progress if progress else 0
        
        # Add bookmark and progress info to content
        content['is_bookmarked'] = is_bookmarked
        content['progress'] = progress_value
        
        return jsonify({
            'success': True,
            'data': content
        })
    except Exception as e:
        print(f"Error fetching content: {e}")
        return jsonify({'success': False, 'message': 'Error fetching content'}), 500

# Cultural Immersion Content
@app.route('/api/cultural_content', methods=['GET'])
@login_required
def cultural_content_api():
    language = request.args.get('language', 'Spanish')
    cultural_aspect = request.args.get('aspect', 'traditions')
    region = request.args.get('region')
    
    content = get_cultural_immersion_content(language, cultural_aspect, region)
    return jsonify({'success': True, 'content': content})

# Toggle bookmark status
@app.route('/api/content/bookmark', methods=['POST'])
@login_required
def toggle_bookmark():
    data = request.json
    content_id = data.get('content_id')
    is_bookmarked = data.get('is_bookmarked', True)
    
    if not content_id:
        return jsonify({'success': False, 'message': 'Content ID is required'}), 400
    
    try:
        # This is a placeholder - implement based on your database model
        from models import ContentBookmark, db
        
        # Check if bookmark already exists
        bookmark = ContentBookmark.query.filter_by(
            user_id=current_user.id,
            content_id=content_id
        ).first()
        
        if is_bookmarked and not bookmark:
            # Create new bookmark
            bookmark = ContentBookmark(
                user_id=current_user.id,
                content_id=content_id
            )
            db.session.add(bookmark)
            db.session.commit()
            return jsonify({'success': True, 'bookmarked': True})
            
        elif not is_bookmarked and bookmark:
            # Remove bookmark
            db.session.delete(bookmark)
            db.session.commit()
            return jsonify({'success': True, 'bookmarked': False})
            
        # No change needed
        return jsonify({'success': True, 'bookmarked': is_bookmarked})
        
    except Exception as e:
        print(f"Error toggling bookmark: {e}")
        return jsonify({'success': False, 'message': 'Error toggling bookmark'}), 500

# Get bookmarked content
@app.route('/api/content/bookmarks', methods=['GET'])
@login_required
def get_bookmarked_content():
    # Get filter parameters
    language = request.args.get('language')
    content_type = request.args.get('type')
    
    try:
        # This is a placeholder - implement based on your database model
        from models import ContentBookmark, db
        from immersion.content import get_content_by_id
        
        # Get user's bookmarks
        bookmarks = ContentBookmark.query.filter_by(user_id=current_user.id).all()
        bookmark_ids = [bookmark.content_id for bookmark in bookmarks]
        
        # Get content for each bookmark
        bookmarked_content = []
        for content_id in bookmark_ids:
            content = get_content_by_id(content_id)
            if content:
                # Apply filters if provided
                if language and content.get('language') != language:
                    continue
                if content_type and content.get('type') != content_type:
                    continue
                    
                # Get progress
                from models import ContentProgress
                progress = ContentProgress.query.filter_by(
                    user_id=current_user.id,
                    content_id=content_id
                ).first()
                
                content['progress'] = progress.progress if progress else 0
                content['is_bookmarked'] = True
                bookmarked_content.append(content)
        
        return jsonify({
            'success': True,
            'data': bookmarked_content
        })
        
    except Exception as e:
        print(f"Error fetching bookmarked content: {e}")
        return jsonify({'success': False, 'message': 'Error fetching bookmarked content'}), 500

# Update content progress
@app.route('/api/content/progress', methods=['POST'])
@login_required
def update_content_progress():
    data = request.json
    content_id = data.get('content_id')
    progress = data.get('progress', 0)
    
    if not content_id:
        return jsonify({'success': False, 'message': 'Content ID is required'}), 400
        
    if not isinstance(progress, (int, float)) or progress < 0 or progress > 100:
        return jsonify({'success': False, 'message': 'Progress must be a number between 0 and 100'}), 400
    
    try:
        # This is a placeholder - implement based on your database model
        from models import ContentProgress, db
        
        # Check if progress record exists
        progress_record = ContentProgress.query.filter_by(
            user_id=current_user.id,
            content_id=content_id
        ).first()
        
        if progress_record:
            # Update existing record
            progress_record.progress = progress
            progress_record.updated_at = datetime.datetime.utcnow()
        else:
            # Create new record
            progress_record = ContentProgress(
                user_id=current_user.id,
                content_id=content_id,
                progress=progress
            )
            db.session.add(progress_record)
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'content_id': content_id,
                'progress': progress,
                'updated_at': progress_record.updated_at.isoformat() if hasattr(progress_record, 'updated_at') else None
            }
        })
        
    except Exception as e:
        print(f"Error updating progress: {e}")
        return jsonify({'success': False, 'message': 'Error updating progress'}), 500

# Mark content as complete
@app.route('/api/content/complete/<int:content_id>', methods=['POST'])
@login_required
def mark_content_complete(content_id):
    try:
        # This is a placeholder - implement based on your database model
        from models import ContentProgress, db
        
        # Check if progress record exists
        progress_record = ContentProgress.query.filter_by(
            user_id=current_user.id,
            content_id=content_id
        ).first()
        
        if progress_record:
            # Update existing record
            progress_record.progress = 100
            progress_record.completed = True
            progress_record.completed_at = datetime.datetime.utcnow()
            progress_record.updated_at = datetime.datetime.utcnow()
        else:
            # Create new record
            progress_record = ContentProgress(
                user_id=current_user.id,
                content_id=content_id,
                progress=100,
                completed=True,
                completed_at=datetime.datetime.utcnow()
            )
            db.session.add(progress_record)
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'content_id': content_id,
                'progress': 100,
                'completed': True,
                'completed_at': progress_record.completed_at.isoformat() if hasattr(progress_record, 'completed_at') else None
            }
        })
        
    except Exception as e:
        print(f"Error marking content as complete: {e}")
        return jsonify({'success': False, 'message': 'Error marking content as complete'}), 500

# Import External Content
@app.route('/api/import_content', methods=['POST'])
@login_required
def import_content_api():
    data = request.json
    content_obj = import_external_content(
        content=data.get('content'),
        title=data.get('title'),
        language=data.get('language', 'Spanish'),
        content_type=data.get('content_type', 'article'),
        source=data.get('source')
    )
    return jsonify({'success': True, 'content': content_obj})

# Process YouTube Transcript
@app.route('/api/process_youtube', methods=['POST'])
@login_required
def process_youtube_api():
    data = request.json
    content_obj = process_youtube_transcript(
        transcript_text=data.get('transcript'),
        video_id=data.get('video_id'),
        title=data.get('title'),
        language=data.get('language', 'Spanish')
    )
    return jsonify({'success': True, 'content': content_obj})

# Test endpoint that doesn't require authentication
@app.route('/api/test', methods=['GET'])
def test_api():
    """Test endpoint that doesn't require authentication"""
    return jsonify({
        'success': True,
        'message': 'API is working!',
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

# n8n Webhook endpoints for automation
@app.route('/api/webhook/lesson_generation', methods=['POST'])
def webhook_lesson_generation():
    data = request.json
    language = data.get('language', 'Spanish')
    level = data.get('level', 'beginner')
    topic = data.get('topic', 'greetings')
    user_id = data.get('user_id')
    
    # Generate a lesson using our internal API
    lesson = generate_interactive_lesson(language, level, topic)
    
    return jsonify({
        'success': True, 
        'message': 'Lesson generated via webhook',
        'lesson': lesson
    })

@app.route('/api/webhook/journal_feedback', methods=['POST'])
def webhook_journal_feedback():
    data = request.json
    journal_entry = data.get('journal_entry')
    language = data.get('language', 'Spanish')
    user_id = data.get('user_id')
    
    # Process the journal entry and provide feedback
    # This would typically call an AI service for analysis
    feedback = {
        'grammar': 'Feedback on grammar would go here',
        'vocabulary': 'Feedback on vocabulary would go here',
        'cultural': 'Cultural insights would go here',
        'fluency': 'Overall fluency assessment would go here'
    }
    
    return jsonify({
        'success': True,
        'message': 'Journal feedback processed via webhook',
        'feedback': feedback
    })

@app.route('/api/webhook/writing_feedback', methods=['POST'])
def webhook_writing_feedback():
    data = request.json
    writing_submission = data.get('writing_submission')
    language = data.get('language', 'Spanish')
    exercise_id = data.get('exercise_id')
    user_id = data.get('user_id')
    
    # Process the writing submission and provide feedback
    feedback = check_writing(writing_submission, language, exercise_id)
    
    return jsonify({
        'success': True,
        'message': 'Writing feedback processed via webhook',
        'feedback': feedback
    })

# n8n Workflow Management
@app.route('/api/n8n/workflows/lesson', methods=['GET'])
def get_lesson_workflow():
    """Generate and return a sample n8n workflow for lesson generation"""
    workflow = generate_sample_lesson_workflow()
    return jsonify(workflow)

@app.route('/api/n8n/workflows/export', methods=['POST'])
def export_workflow():
    """Export a workflow to a file"""
    data = request.json
    workflow = data.get('workflow')
    filename = data.get('filename', 'workflow.json')
    
    if not workflow:
        return jsonify({'success': False, 'message': 'No workflow provided'})
    
    filepath = os.path.join('ai_integration', 'workflows', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    success = export_workflow_to_file(workflow, filepath)
    
    if success:
        return jsonify({'success': True, 'message': f'Workflow exported to {filepath}'})
    else:
        return jsonify({'success': False, 'message': 'Failed to export workflow'})

# Trigger n8n workflows
@app.route('/api/trigger/lesson_workflow', methods=['POST'])
def trigger_lesson():
    """Trigger an n8n workflow for lesson generation"""
    data = request.json
    result = trigger_lesson_workflow(
        language=data.get('language', 'Spanish'),
        level=data.get('level', 'beginner'),
        topic=data.get('topic', 'greetings'),
        user_id=data.get('user_id')
    )
    return jsonify(result)

@app.route('/api/trigger/journal_workflow', methods=['POST'])
def trigger_journal():
    """Trigger an n8n workflow for journal feedback"""
    data = request.json
    result = trigger_journal_feedback_workflow(
        journal_entry=data.get('journal_entry'),
        language=data.get('language', 'Spanish'),
        user_id=data.get('user_id')
    )
    return jsonify(result)

@app.route('/api/trigger/writing_workflow', methods=['POST'])
def trigger_writing():
    """Trigger an n8n workflow for writing feedback"""
    data = request.json
    result = trigger_writing_feedback_workflow(
        writing_submission=data.get('writing_submission'),
        exercise_id=data.get('exercise_id'),
        language=data.get('language', 'Spanish'),
        user_id=data.get('user_id')
    )
    return jsonify(result)

if __name__ == '__main__':
    import sys
    
    # Check if we're running on Replit
    is_replit = os.environ.get('REPL_ID') is not None
    
    # Get port from environment variable (for Replit) or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Check command line arguments for HTTPS flag
    use_https = '--https' in sys.argv
    
    if is_replit:
        # Replit configuration
        print("Running on Replit...")
        print(f"Using port: {port}")
        print(f"OpenAI API Key available: {os.getenv('OPENAI_API_KEY') is not None}")
        app.run(debug=False, host='0.0.0.0', port=port)
    elif use_https:
        # Local HTTPS configuration
        cert_path = 'certs/cert.pem'
        key_path = 'certs/key.pem'
        
        # Check if certificates exist, if not generate them
        if not (os.path.exists(cert_path) and os.path.exists(key_path)):
            print("SSL certificates not found. Generating self-signed certificates...")
            try:
                from generate_cert import generate_self_signed_cert
                os.makedirs('certs', exist_ok=True)
                generate_self_signed_cert(cert_file=cert_path, key_file=key_path)
            except Exception as e:
                print(f"Error generating certificates: {e}")
                print("Please run 'python generate_cert.py' first or install pyOpenSSL with 'pip install pyOpenSSL'")
                sys.exit(1)
        
        print(f"Running with HTTPS on https://localhost:{port}")
        print("Note: Since this is using a self-signed certificate, your browser will show a security warning.")
        print("You can proceed by accepting the risk or adding an exception for this certificate.")
        
        app.run(debug=True, host='0.0.0.0', port=port, ssl_context=(cert_path, key_path))
    else:
        # Regular HTTP configuration
        print(f"Running with HTTP on http://localhost:{port}")
        print("To run with HTTPS, use: python app.py --https")
        app.run(debug=True, host='0.0.0.0', port=port)
