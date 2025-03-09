import unittest
import json
from app import app

class SaludAppTestCase(unittest.TestCase):
    """Test case for the ¡Salud! Language Learning Platform"""

    def setUp(self):
        """Set up test client"""
        self.app = app.test_client()
        self.app.testing = True

    def test_home_page(self):
        """Test that the home page loads"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_lesson_generation_endpoint(self):
        """Test the lesson generation API endpoint"""
        test_data = {
            'language': 'Spanish',
            'level': 'beginner',
            'topic': 'greetings'
        }
        response = self.app.post('/api/generate_lesson',
                                data=json.dumps(test_data),
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('lesson', data)

    def test_journal_endpoint(self):
        """Test the journal API endpoint"""
        # Test GET request
        response = self.app.get('/api/journal')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('entries', data)

    def test_immersion_content_endpoint(self):
        """Test the immersion content API endpoint"""
        response = self.app.get('/api/immersion_content?language=Spanish&type=article&difficulty=beginner')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('content', data)

    def test_webhook_endpoint(self):
        """Test the webhook API endpoint"""
        test_data = {
            'language': 'Spanish',
            'level': 'beginner',
            'topic': 'greetings'
        }
        response = self.app.post('/api/webhook/lesson_generation',
                                data=json.dumps(test_data),
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('message', data)

if __name__ == '__main__':
    unittest.main()
