import React, { useState, useEffect } from 'react';
import { contentApi } from '../lib/api';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Immersion() {
  const [contentType, setContentType] = useState('all');
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [language, setLanguage] = useState('Spanish');
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const contentTypes = [
    { id: 'articles', name: 'Articles', icon: 'newspaper' },
    { id: 'videos', name: 'Videos', icon: 'video' },
    { id: 'podcasts', name: 'Podcasts', icon: 'microphone' },
    { id: 'books', name: 'Books', icon: 'book' },
    { id: 'music', name: 'Music', icon: 'music' }
  ];

  const levels = [
    { id: 'beginner', name: 'Beginner (A1-A2)' },
    { id: 'intermediate', name: 'Intermediate (B1-B2)' },
    { id: 'advanced', name: 'Advanced (C1-C2)' }
  ];

  const topics = [
    { id: 'general', name: 'General Interest' },
    { id: 'culture', name: 'Culture & Traditions' },
    { id: 'travel', name: 'Travel & Geography' },
    { id: 'food', name: 'Food & Cuisine' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'news', name: 'Current Events' },
    { id: 'business', name: 'Business & Economics' },
    { id: 'science', name: 'Science & Technology' }
  ];

  const languages = [
    { id: 'Spanish', name: 'Spanish' },
    { id: 'French', name: 'French' },
    { id: 'German', name: 'German' },
    { id: 'Italian', name: 'Italian' },
    { id: 'Portuguese', name: 'Portuguese' },
    { id: 'Japanese', name: 'Japanese' },
    { id: 'Chinese', name: 'Chinese' }
  ];

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create filters object based on current state
        const filters = {
          language,
          contentType: contentType !== 'all' ? contentType : null,
          topic: topic !== 'all' ? topic : null,
          difficulty: level !== 'all' ? level : null,
          bookmarkedOnly: showBookmarksOnly
        };
        
        // Fetch content from API
        const response = await contentApi.getImmersionContent(filters);
        
        if (response && response.data) {
          setContentItems(response.data.content || []);
          
          // If bookmarked content is included in the response
          if (response.data.bookmarks) {
            setBookmarks(response.data.bookmarks);
          } else {
            // Otherwise fetch bookmarks separately
            const bookmarksResponse = await contentApi.getBookmarkedContent();
            if (bookmarksResponse && bookmarksResponse.data) {
              const bookmarkIds = bookmarksResponse.data.map(item => item.id);
              setBookmarks(bookmarkIds);
            }
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [language, contentType, level, topic, showBookmarksOnly]);

  // Filter content based on selected filters
  const filteredContent = contentItems.filter(item => {
    const matchesType = contentType === 'all' || item.type === contentType;
    const matchesLevel = level === 'all' || item.level === level;
    const matchesTopic = topic === 'all' || item.topic === topic;
    const matchesLanguage = language === 'all' || item.language === language;
    const matchesBookmark = !showBookmarksOnly || bookmarks.includes(item.id);
    
    return matchesType && matchesLevel && matchesTopic && matchesLanguage && matchesBookmark;
  });

  // Toggle bookmark status
  const toggleBookmark = async (id) => {
    try {
      const isCurrentlyBookmarked = bookmarks.includes(id);
      
      // Optimistically update UI
      if (isCurrentlyBookmarked) {
        setBookmarks(bookmarks.filter(bookmarkId => bookmarkId !== id));
      } else {
        setBookmarks([...bookmarks, id]);
      }
      
      // Call API to update bookmark status
      await contentApi.toggleBookmark(id, !isCurrentlyBookmarked);
      
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      
      // Revert UI change on error
      if (bookmarks.includes(id)) {
        setBookmarks(bookmarks.filter(bookmarkId => bookmarkId !== id));
      } else {
        setBookmarks([...bookmarks, id]);
      }
      
      alert('Failed to update bookmark. Please try again.');
    }
  };

  // Update progress
  const updateProgress = async (id, newProgress) => {
    try {
      // Optimistically update UI
      setContentItems(contentItems.map(item => 
        item.id === id ? { ...item, progress: newProgress } : item
      ));
      
      // Call API to update progress
      await contentApi.updateProgress(id, newProgress);
      
    } catch (err) {
      console.error('Error updating progress:', err);
      
      // Revert UI change on error
      const originalItem = contentItems.find(item => item.id === id);
      if (originalItem) {
        setContentItems(contentItems.map(item => 
          item.id === id ? { ...item, progress: originalItem.progress } : item
        ));
      }
      
      alert('Failed to update progress. Please try again.');
    }
  };

  // View content details
  const viewContent = async (item) => {
    try {
      setLoading(true);
      
      // Fetch full content details from API
      const response = await contentApi.getContentById(item.id);
      
      if (response && response.data) {
        setSelectedContent(response.data);
        
        // Update progress when viewing content
        if (response.data.progress === 0) {
          updateProgress(item.id, 10); // Start progress at 10%
        }
      } else {
        // If API call fails, use the item data we already have
        setSelectedContent(item);
        if (item.progress === 0) {
          updateProgress(item.id, 10);
        }
      }
    } catch (err) {
      console.error('Error fetching content details:', err);
      // Fall back to using the item data we already have
      setSelectedContent(item);
      if (item.progress === 0) {
        updateProgress(item.id, 10);
      }
    } finally {
      setLoading(false);
    }
  };

  // Close content details
  const closeContent = () => {
    setSelectedContent(null);
  };

  // Complete content
  const markAsComplete = async (id) => {
    try {
      // Optimistically update UI
      updateProgress(id, 100);
      
      // Call API to mark as complete
      await contentApi.markAsComplete(id);
      
      closeContent();
    } catch (err) {
      console.error('Error marking content as complete:', err);
      alert('Failed to mark content as complete. Please try again.');
    }
  };

  // Render content based on type
  const renderContentDetail = (item) => {
    switch (item.type) {
      case 'articles':
        return (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
        );
      case 'videos':
        return (
          <div className="aspect-w-16 aspect-h-9 mb-6">
            <iframe 
              src={item.content} 
              title={item.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
            ></iframe>
          </div>
        );
      case 'podcasts':
        return (
          <div className="h-[152px] mb-6">
            <iframe 
              src={item.content} 
              title={item.title}
              className="w-full h-full rounded-lg"
              frameBorder="0" 
              allowTransparency="true" 
              allow="encrypted-media"
            ></iframe>
          </div>
        );
      default:
        return <p>Content not available</p>;
    }
  };

  // Render content card
  const renderContentCard = (item) => {
    const isBookmarked = bookmarks.includes(item.id);
    
    return (
      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={item.thumbnail} 
            alt={item.title} 
            className="w-full h-48 object-cover"
          />
          {item.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-orange-500 h-1.5 rounded-full" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          <button
            onClick={() => toggleBookmark(item.id)}
            className={`absolute top-2 right-2 p-1 rounded-full ${
              isBookmarked ? 'bg-yellow-500 text-white' : 'bg-white text-gray-400'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {levels.find(l => l.id === item.level)?.name.split(' ')[0]}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">
              <svg className="inline-block h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {item.duration}
            </span>
            <button 
              onClick={() => viewContent(item)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-sm transition"
            >
              View Content
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {selectedContent ? (
          // Content Detail View
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <button 
                    onClick={closeContent}
                    className="text-gray-500 hover:text-gray-700 mb-4 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Content List
                  </button>
                  <h1 className="text-2xl font-bold">{selectedContent.title}</h1>
                  <div className="flex flex-wrap items-center mt-2 gap-2">
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {levels.find(l => l.id === selectedContent.level)?.name.split(' ')[0]}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {selectedContent.language}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {topics.find(t => t.id === selectedContent.topic)?.name}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {selectedContent.duration}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={() => toggleBookmark(selectedContent.id)}
                    className={`mr-3 ${bookmarks.includes(selectedContent.id) ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
                    aria-label={bookmarks.includes(selectedContent.id) ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => markAsComplete(selectedContent.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition"
                  >
                    Mark as Complete
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">{selectedContent.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-orange-500 h-2.5 rounded-full" 
                    style={{ width: `${selectedContent.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {renderContentDetail(selectedContent)}
              
              {selectedContent.vocabulary && selectedContent.vocabulary.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Key Vocabulary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedContent.vocabulary.map((item, index) => (
                        <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.word}</span>
                            <span className="text-gray-600">{item.translation}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Content List View
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-3xl font-bold">Language Immersion</h1>
              
              <div className="mt-4 md:mt-0 flex items-center">
                <label className="inline-flex items-center cursor-pointer mr-4">
                  <input 
                    type="checkbox" 
                    checked={showBookmarksOnly} 
                    onChange={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Bookmarks Only</span>
                </label>
                
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                )}
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-lg mb-4">
                Immerse yourself in authentic content to improve your language skills naturally.
                Choose from articles, videos, podcasts, and more tailored to your level and interests.
              </p>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Find Content</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Language Filter */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Languages</option>
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Content Type Filter */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Types</option>
                    {contentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Level Filter */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Levels</option>
                    {levels.map(lvl => (
                      <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Topic Filter */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Topics</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Content Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Loading content...</span>
              </div>
            ) : error ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-red-500">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Try again
                </button>
              </div>
            ) : filteredContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map(item => renderContentCard(item))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                <p>No content matches your current filters.</p>
                <button 
                  onClick={() => {
                    setContentType('all');
                    setLevel('all');
                    setTopic('all');
                    setLanguage('all');
                    setShowBookmarksOnly(false);
                  }} 
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
