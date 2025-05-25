import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { learningApi } from '../../lib/api';
import ReactMarkdown from 'react-markdown';

const LessonViewer = ({ lessonId }) => {
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Fetch lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await learningApi.getLesson(lessonId);
        
        if (response.success) {
          setLesson(response.lesson);
          // Set initial progress if available
          if (response.lesson.completionRate) {
            setProgress(response.lesson.completionRate);
          }
        } else {
          throw new Error(response.message || 'Failed to load lesson');
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLesson();
  }, [lessonId]);
  
  // Track scroll progress
  useEffect(() => {
    if (!lesson) return;
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      const newProgress = Math.min(Math.round(scrollPercent * 100), 100);
      
      // Only update if progress increases
      if (newProgress > progress) {
        setProgress(newProgress);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lesson, progress]);
  
  // Save progress when user reaches the end or leaves the page
  useEffect(() => {
    if (!lesson || !lessonId) return;
    
    // Save progress when component unmounts
    return () => {
      if (progress > 0) {
        learningApi.trackLessonProgress(lessonId, progress)
          .catch(err => console.error('Error saving progress on unmount:', err));
      }
    };
  }, [lessonId, lesson, progress]);
  
  // Handle manual progress save
  const handleSaveProgress = async () => {
    if (!lessonId || progress === 0) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      
      const response = await learningApi.trackLessonProgress(lessonId, progress);
      
      if (response.success) {
        setSaveSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to save progress');
      }
    } catch (err) {
      console.error('Error saving progress:', err);
      setSaveError('Failed to save progress. Please try again.');
      // Clear error message after 3 seconds
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle marking lesson as complete
  const handleCompleteLesson = async () => {
    if (!lessonId) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      
      const response = await learningApi.completeLesson(lessonId);
      
      if (response.success) {
        setProgress(100);
        setSaveSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to mark lesson as complete');
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      setSaveError('Failed to mark lesson as complete. Please try again.');
      // Clear error message after 3 seconds
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle going back to lessons list
  const handleBackToLessons = () => {
    router.push('/lessons');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading lesson...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 mb-6">
          <p>{error}</p>
        </div>
        <button
          onClick={handleBackToLessons}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
      </div>
    );
  }
  
  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200 mb-6">
          <p>Lesson not found.</p>
        </div>
        <button
          onClick={handleBackToLessons}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={handleBackToLessons}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
      </div>
      
      {/* Lesson header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
        <div className="flex flex-wrap items-center text-gray-600 gap-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {lesson.language}
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {lesson.level}
          </span>
          {lesson.duration && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lesson.duration}
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="sticky top-0 bg-white z-10 pt-2 pb-4 border-b mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Save/Complete buttons */}
        <div className="flex justify-between mt-3">
          <div>
            {saveSuccess && (
              <span className="text-green-600 text-sm">
                Progress saved successfully!
              </span>
            )}
            {saveError && (
              <span className="text-red-600 text-sm">
                {saveError}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveProgress}
              disabled={saving || progress === 0}
              className={`text-sm px-3 py-1 rounded ${
                saving || progress === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={handleCompleteLesson}
              disabled={saving || progress === 100}
              className={`text-sm px-3 py-1 rounded ${
                saving || progress === 100
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {progress === 100 ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Lesson content */}
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </div>
      
      {/* Bottom navigation */}
      <div className="mt-12 pt-6 border-t flex justify-between">
        <button
          onClick={handleBackToLessons}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleSaveProgress}
            disabled={saving || progress === 0}
            className={`px-4 py-2 rounded ${
              saving || progress === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          <button
            onClick={handleCompleteLesson}
            disabled={saving || progress === 100}
            className={`px-4 py-2 rounded ${
              saving || progress === 100
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {progress === 100 ? 'Completed' : 'Mark as Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
