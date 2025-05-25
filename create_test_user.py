from app import app, db
from models import User
import datetime

def create_test_user():
    with app.app_context():
        # Check if test user already exists
        existing_user = User.query.filter_by(username='testuser').first()
        if existing_user:
            print("Test user already exists")
            return
        
        # Create a new test user
        test_user = User(
            username='testuser',
            email='test@example.com',
            first_name='Test',
            last_name='User',
            target_language='Spanish',
            proficiency_level='beginner',
            learning_goals=['Become conversational', 'Read books in Spanish'],
            created_at=datetime.datetime.utcnow(),
            email_verified=True
        )
        test_user.set_password('password123')
        
        # Add to database
        db.session.add(test_user)
        db.session.commit()
        
        print(f"Created test user with ID: {test_user.id}")
        print("Username: testuser")
        print("Password: password123")

if __name__ == '__main__':
    create_test_user()
