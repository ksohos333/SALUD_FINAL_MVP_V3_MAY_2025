import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { learningApi } from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Fetch lessons from API
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to get lessons
        const response = await learningApi.getLessons(20, activeFilter !== 'All' ? activeFilter : null);
        
        if (response.success) {
          setLessons(response.lessons || []);
        } else {
          throw new Error(response.message || 'Failed to load lessons');
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again later.');
        
        // Fallback to mock data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data as fallback in development');
          const mockLessons = [
            {
              id: '1',
              title: 'Basic Greetings',
              language: 'Spanish',
              level: 'Beginner',
              description: 'Learn common greetings and introductions in Spanish.',
              imageUrl: '/static/img/lessons/greetings.jpg',
              duration: '30 min',
              completionRate: 0
            },
            {
              id: '2',
              title: 'Food and Dining',
              language: 'Spanish',
              level: 'Beginner',
              description: 'Vocabulary and phrases for ordering food and dining out.',
              imageUrl: '/static/img/lessons/food.jpg',
              duration: '45 min',
              completionRate: 0
            },
            {
              id: '3',
              title: 'Past Tense',
              language: 'Spanish',
              level: 'Intermediate',
              description: 'Learn how to talk about past events using preterite and imperfect tenses.',
              imageUrl: '/static/img/lessons/past-tense.jpg',
              duration: '60 min',
              completionRate: 0
            },
            {
              id: '4',
              title: 'Subjunctive Mood',
              language: 'Spanish',
              level: 'Advanced',
              description: 'Master the subjunctive mood for expressing uncertainty, desires, and hypotheticals.',
              imageUrl: '/static/img/lessons/subjunctive.jpg',
              duration: '75 min',
              completionRate: 0
            },
            {
              id: '5',
              title: 'Travel Vocabulary',
              language: 'Spanish',
              level: 'Beginner',
              description: 'Essential vocabulary and phrases for traveling in Spanish-speaking countries.',
              imageUrl: '/static/img/lessons/travel.jpg',
              duration: '45 min',
              completionRate: 0
            },
            {
              id: '6',
              title: 'Conditional Tense',
              language: 'Spanish',
              level: 'Intermediate',
              description: 'Learn to express hypothetical situations and polite requests using the conditional tense.',
              imageUrl: '/static/img/lessons/conditional.jpg',
              duration: '60 min',
              completionRate: 0
            },
          ];
          
          setLessons(mockLessons);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [activeFilter]); // Re-fetch when filter changes

  // Filter lessons based on search query
  const filteredLessons = lessons.filter(lesson => {
    // Filter by search query only (level filtering is done by API)
    if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !lesson.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Handle starting a lesson
  const handleStartLesson = async (lessonId) => {
    try {
      // Track that the user started this lesson
      await learningApi.trackLessonProgress(lessonId, 0);
      
      // Navigate to the lesson page
      router.push(`/lessons/${lessonId}`);
    } catch (error) {
      console.error('Error starting lesson:', error);
      // Navigate anyway even if tracking fails
      router.push(`/lessons/${lessonId}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h1 className="text-3xl font-bold">Interactive Lessons</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            {/* Create Lesson Button */}
            <Link href="/lessons/create">
              <a className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Lesson
              </a>
            </Link>
            
            {/* Search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search lessons..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-lg mb-4">
            Our interactive lessons are designed to help you learn Spanish through engaging, 
            task-based activities. Choose a lesson below to get started.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeFilter === 'All' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => setActiveFilter('All')}
            >
              All Levels
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeFilter === 'Beginner' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => setActiveFilter('Beginner')}
            >
              Beginner
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeFilter === 'Intermediate' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => setActiveFilter('Intermediate')}
            >
              Intermediate
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeFilter === 'Advanced' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => setActiveFilter('Advanced')}
            >
              Advanced
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading lessons...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 mb-6">
            {error}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No lessons found matching your criteria.</p>
            <button 
              className="mt-4 text-blue-600 hover:text-blue-800"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <LessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onStart={() => handleStartLesson(lesson.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function LessonCard({ lesson, onStart }) {
  // Define level colors
  const levelColors = {
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };

  // Default image if none provided
  const imageUrl = lesson.imageUrl || '/static/img/lessons/default.jpg';
  
  // Generate a color based on the lesson title for the fallback background
  const generateColor = (title) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    return `#${color.padStart(6, '0')}`;
  };
  
  const fallbackColor = generateColor(lesson.title);
  const fallbackStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fallbackColor,
    color: '#ffffff',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '1rem'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image section */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            // Fallback in case image doesn't load
            backgroundColor: fallbackColor
          }}
          onError={(e) => {
            // If image fails to load, replace with a colored div containing the title
            e.target.onerror = null;
            e.target.style.backgroundImage = 'none';
            e.target.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:1rem;text-align:center;color:white;">${lesson.title}</div>`;
          }}
        >
          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Level badge */}
          <span className={`absolute top-3 right-3 ${levelColors[lesson.level] || 'bg-blue-100 text-blue-800'} text-xs px-2 py-1 rounded-full font-medium`}>
            {lesson.level}
          </span>
          
          {/* Duration */}
          <div className="absolute bottom-3 left-3 flex items-center text-white text-sm">
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {lesson.duration}
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
        <p className="text-gray-600 mb-4">{lesson.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{lesson.language}</span>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            onClick={onStart}
          >
            Start Lesson
          </button>
        </div>
        
        {/* Progress bar for completion rate */}
        {lesson.completionRate > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{lesson.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${lesson.completionRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
