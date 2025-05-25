import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { learningApi } from '../../lib/api';

const LessonCreator = () => {
  const router = useRouter();
  const [lessonType, setLessonType] = useState('interactive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newLessonId, setNewLessonId] = useState(null);
  
  // Interactive lesson form state
  const [interactiveForm, setInteractiveForm] = useState({
    language: 'Spanish',
    level: 'Beginner',
    topic: '',
    task_based: true
  });
  
  // Subject-based lesson form state
  const [subjectForm, setSubjectForm] = useState({
    language: 'Spanish',
    level: 'Beginner',
    subject: '',
    topic: ''
  });
  
  // Handle form input changes for interactive lessons
  const handleInteractiveChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInteractiveForm({
      ...interactiveForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle form input changes for subject-based lessons
  const handleSubjectChange = (e) => {
    const { name, value } = e.target;
    setSubjectForm({
      ...subjectForm,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      let response;
      
      if (lessonType === 'interactive') {
        // Validate form
        if (!interactiveForm.topic) {
          throw new Error('Please enter a topic for your lesson');
        }
        
        // Generate interactive lesson
        response = await learningApi.generateInteractiveLesson(interactiveForm);
      } else {
        // Validate form
        if (!subjectForm.subject || !subjectForm.topic) {
          throw new Error('Please enter both a subject and topic for your lesson');
        }
        
        // Generate subject-based lesson
        response = await learningApi.generateSubjectLesson(subjectForm);
      }
      
      if (response.success) {
        setSuccess(true);
        setNewLessonId(response.lesson.id);
        
        // Redirect to the new lesson after a short delay
        setTimeout(() => {
          router.push(`/lessons/${response.lesson.id}`);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to create lesson');
      }
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Lesson Type Selector */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-4 px-6 text-center font-medium ${
            lessonType === 'interactive'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setLessonType('interactive')}
        >
          Interactive Language Lesson
        </button>
        <button
          className={`flex-1 py-4 px-6 text-center font-medium ${
            lessonType === 'subject'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setLessonType('subject')}
        >
          Subject-Based Immersion
        </button>
      </div>
      
      {/* Form Container */}
      <div className="p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <p>Your lesson has been created successfully! Redirecting you to the lesson...</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {/* Interactive Lesson Form */}
        {lessonType === 'interactive' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Create an Interactive Language Lesson</h2>
              <p className="text-gray-600 mb-4">
                Interactive language lessons focus on teaching specific language skills through
                engaging activities and exercises.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Language Selection */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={interactiveForm.language}
                  onChange={handleInteractiveChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Russian">Russian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Korean">Korean</option>
                </select>
              </div>
              
              {/* Level Selection */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={interactiveForm.level}
                  onChange={handleInteractiveChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            {/* Topic Input */}
            <div className="mb-6">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Topic
              </label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={interactiveForm.topic}
                onChange={handleInteractiveChange}
                placeholder="e.g., Food and Dining, Travel Vocabulary, Past Tense"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a specific topic for your lesson. Be as specific as possible for better results.
              </p>
            </div>
            
            {/* Task-based Checkbox */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="task_based"
                  name="task_based"
                  checked={interactiveForm.task_based}
                  onChange={handleInteractiveChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="task_based" className="ml-2 block text-sm text-gray-700">
                  Include a real-world task challenge
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                Task-based lessons include a practical challenge that helps you apply what you've learned in real-world situations.
              </p>
            </div>
            
            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Lesson...
                  </span>
                ) : (
                  'Create Interactive Lesson'
                )}
              </button>
            </div>
          </form>
        )}
        
        {/* Subject-Based Lesson Form */}
        {lessonType === 'subject' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Create a Subject-Based Immersion Lesson</h2>
              <p className="text-gray-600 mb-4">
                Subject-based immersion lessons teach academic subjects in your target language,
                helping you learn specialized vocabulary while gaining knowledge in a specific field.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Language Selection */}
              <div>
                <label htmlFor="subject-language" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Language
                </label>
                <select
                  id="subject-language"
                  name="language"
                  value={subjectForm.language}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Russian">Russian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Korean">Korean</option>
                </select>
              </div>
              
              {/* Level Selection */}
              <div>
                <label htmlFor="subject-level" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="subject-level"
                  name="level"
                  value={subjectForm.level}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            {/* Subject Input */}
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Academic Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={subjectForm.subject}
                onChange={handleSubjectChange}
                placeholder="e.g., History, Biology, Mathematics, Literature"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose an academic subject you'd like to learn about in your target language.
              </p>
            </div>
            
            {/* Topic Input */}
            <div className="mb-6">
              <label htmlFor="subject-topic" className="block text-sm font-medium text-gray-700 mb-1">
                Specific Topic
              </label>
              <input
                type="text"
                id="subject-topic"
                name="topic"
                value={subjectForm.topic}
                onChange={handleSubjectChange}
                placeholder="e.g., French Revolution, Cell Biology, Quadratic Equations"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Specify a topic within your chosen subject. Being specific will result in a more focused lesson.
              </p>
            </div>
            
            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Lesson...
                  </span>
                ) : (
                  'Create Subject-Based Lesson'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LessonCreator;
