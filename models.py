from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import json
from sqlalchemy.ext.mutable import MutableDict, MutableList

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """User model for authentication and profile information"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # User profile information
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    
    # Subscription and payment information
    subscription_tier = db.Column(db.String(20), default='free')  # 'free' or 'premium'
    subscription_start = db.Column(db.DateTime, nullable=True)
    subscription_end = db.Column(db.DateTime, nullable=True)
    
    # Learning preferences
    target_language = db.Column(db.String(50), default='Spanish')
    proficiency_level = db.Column(db.String(20), default='beginner')  # beginner, intermediate, advanced
    learning_goals = db.Column(MutableList.as_mutable(db.JSON), default=list)
    interface_preferences = db.Column(MutableDict.as_mutable(db.JSON), default=dict)
    
    # Relationships
    journal_entries = db.relationship('JournalEntry', backref='user', lazy=True)
    saved_words = db.relationship('SavedWord', backref='user', lazy=True)
    lesson_progress = db.relationship('LessonProgress', backref='user', lazy=True)
    
    # Email verification
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), nullable=True)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def is_premium(self):
        """Check if user has an active premium subscription"""
        if self.subscription_tier != 'premium':
            return False
        
        if not self.subscription_end:
            return False
            
        return self.subscription_end > datetime.datetime.utcnow()
    
    def to_dict(self):
        """Convert user object to dictionary for API responses"""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'subscription_tier': self.subscription_tier,
            'is_premium': self.is_premium(),
            'target_language': self.target_language,
            'proficiency_level': self.proficiency_level,
            'learning_goals': self.learning_goals,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class ContentSource(db.Model):
    """Model for content sources (articles, videos, etc.)"""
    __tablename__ = 'content_sources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # article, video, etc.
    content = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(50), nullable=False)
    source_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    saved_words = db.relationship('SavedWord', backref='source', lazy=True)
    
    def to_dict(self):
        """Convert content source to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'content_type': self.content_type,
            'language': self.language,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SavedWord(db.Model):
    """Model for words saved by users"""
    __tablename__ = 'saved_words'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    word = db.Column(db.String(100), nullable=False)
    context = db.Column(db.Text, nullable=True)
    language = db.Column(db.String(50), nullable=False)
    translation = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_reviewed = db.Column(db.DateTime, nullable=True)
    familiarity_level = db.Column(db.Integer, default=0)  # 0-5 scale for spaced repetition
    
    # New fields for enhanced vocabulary system
    word_type = db.Column(db.String(50), nullable=True)  # noun, verb, adjective, etc.
    tags = db.Column(MutableList.as_mutable(db.JSON), default=list)  # for categorization
    source_content_id = db.Column(db.Integer, db.ForeignKey('content_sources.id'), nullable=True)
    next_review_date = db.Column(db.DateTime, nullable=True)  # for spaced repetition
    pronunciation_guide = db.Column(db.String(255), nullable=True)  # for pronunciation help
    
    def to_dict(self):
        """Convert saved word to dictionary for API responses"""
        return {
            'id': self.id,
            'word': self.word,
            'context': self.context,
            'language': self.language,
            'translation': self.translation,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            'familiarity_level': self.familiarity_level,
            'word_type': self.word_type,
            'tags': self.tags,
            'source_content_id': self.source_content_id,
            'next_review_date': self.next_review_date.isoformat() if self.next_review_date else None,
            'pronunciation_guide': self.pronunciation_guide
        }

class JournalEntry(db.Model):
    """Model for user journal entries"""
    __tablename__ = 'journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.utcnow)
    ai_feedback = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        """Convert journal entry to dictionary for API responses"""
        return {
            'id': self.id,
            'content': self.content,
            'language': self.language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'ai_feedback': self.ai_feedback
        }

class Lesson(db.Model):
    """Model for language lessons"""
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    language = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(20), nullable=False)  # beginner, intermediate, advanced
    topic = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_premium = db.Column(db.Boolean, default=False)
    
    # Relationships
    progress = db.relationship('LessonProgress', backref='lesson', lazy=True)
    
    def to_dict(self):
        """Convert lesson to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'language': self.language,
            'level': self.level,
            'topic': self.topic,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_premium': self.is_premium
        }

class LessonProgress(db.Model):
    """Model for tracking user progress through lessons"""
    __tablename__ = 'lesson_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    progress_percentage = db.Column(db.Float, default=0.0)  # 0-100
    completed = db.Column(db.Boolean, default=False)
    started_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        """Convert lesson progress to dictionary for API responses"""
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'progress_percentage': self.progress_percentage,
            'completed': self.completed,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
