import React, { useState, useEffect } from 'react';
import { vocabularyApi } from '../lib/api';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Vocabulary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch vocabulary data
  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to get vocabulary
        const filters = {};
        if (filter !== 'all') {
          filters.category = filter;
        }
        if (searchTerm) {
          filters.search = searchTerm;
        }
        
        const response = await vocabularyApi.getVocabulary(filters);
        
        if (response.success) {
          setVocabulary(response.words || []);
        } else {
          throw new Error(response.message || 'Failed to load vocabulary');
        }
      } catch (err) {
        console.error('Error fetching vocabulary:', err);
        setError('Failed to load vocabulary. Please try again later.');
        
        // Fallback to mock data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data as fallback in development');
          const mockVocabulary = [
            {
              id: 1,
              word: 'casa',
              translation: 'house',
              language: 'Spanish',
              category: 'nouns',
              notes: 'Feminine noun (la casa)',
              examples: ['Mi casa es grande.', 'Vamos a mi casa.'],
              mastery: 4,
              lastPracticed: '2025-03-15'
            },
            {
              id: 2,
              word: 'hablar',
              translation: 'to speak',
              language: 'Spanish',
              category: 'verbs',
              notes: 'Regular -ar verb',
              examples: ['Yo hablo español.', '¿Hablas inglés?'],
              mastery: 3,
              lastPracticed: '2025-03-20'
            },
            {
              id: 3,
              word: 'rápido',
              translation: 'fast, quick',
              language: 'Spanish',
              category: 'adjectives',
              notes: 'Can be used as an adverb (rápidamente)',
              examples: ['El coche es rápido.', 'Corre rápido.'],
              mastery: 2,
              lastPracticed: '2025-03-18'
            },
            {
              id: 4,
              word: 'siempre',
              translation: 'always',
              language: 'Spanish',
              category: 'adverbs',
              notes: '',
              examples: ['Siempre llego temprano.', 'Él siempre está feliz.'],
              mastery: 5,
              lastPracticed: '2025-03-10'
            },
            {
              id: 5,
              word: 'pero',
              translation: 'but',
              language: 'Spanish',
              category: 'conjunctions',
              notes: 'Used to connect contrasting ideas',
              examples: ['Quiero ir, pero no puedo.', 'Es caro pero bueno.'],
              mastery: 5,
              lastPracticed: '2025-03-12'
            },
            {
              id: 6,
              word: 'feliz',
              translation: 'happy',
              language: 'Spanish',
              category: 'adjectives',
              notes: 'Irregular plural: felices',
              examples: ['Estoy feliz hoy.', '¡Feliz cumpleaños!'],
              mastery: 3,
              lastPracticed: '2025-03-22'
            }
          ];
          
          setVocabulary(mockVocabulary);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, [filter, searchTerm]); // Re-fetch when filter or search changes

  // Filter vocabulary based on search term and category filter
  const filteredVocabulary = vocabulary.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || item.category === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Add a new word to vocabulary
  const handleAddWord = async (e) => {
    e.preventDefault();
    
    if (newWord.trim() === '' || newTranslation.trim() === '') {
      alert('Word and translation are required');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create word data
      const wordData = {
        word: newWord,
        translation: newTranslation,
        language: 'Spanish', // Default language
        category: filter !== 'all' ? filter : 'nouns', // Use selected filter or default to nouns
        notes: newNotes,
      };
      
      // Call API to save word
      const response = await vocabularyApi.saveWord(wordData);
      
      if (response.success) {
        // Add the new word to the vocabulary list
        if (response.word) {
          setVocabulary([...vocabulary, response.word]);
        } else {
          // If the API doesn't return the word, refresh the vocabulary list
          const refreshResponse = await vocabularyApi.getVocabulary();
          if (refreshResponse.success) {
            setVocabulary(refreshResponse.words || []);
          }
        }
        
        // Reset form
        setNewWord('');
        setNewTranslation('');
        setNewNotes('');
        setShowAddForm(false);
      } else {
        throw new Error(response.message || 'Failed to add word');
      }
    } catch (err) {
      console.error('Error adding word:', err);
      alert(err.message || 'Failed to add word. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a word from vocabulary
  const handleDeleteWord = async (id) => {
    if (!confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Optimistic UI update
      const originalVocabulary = [...vocabulary];
      setVocabulary(vocabulary.filter(item => item.id !== id));
      
      // Call API to delete word
      const response = await vocabularyApi.deleteWord(id);
      
      if (!response.success) {
        // If deletion failed, restore the original vocabulary
        setVocabulary(originalVocabulary);
        throw new Error(response.message || 'Failed to delete word');
      }
    } catch (err) {
      console.error('Error deleting word:', err);
      alert(err.message || 'Failed to delete word. Please try again.');
    }
  };

  // Update mastery level
  const handleUpdateMastery = async (id, newMastery) => {
    try {
      // Optimistic UI update
      const originalVocabulary = [...vocabulary];
      setVocabulary(vocabulary.map(item => 
        item.id === id 
          ? { ...item, mastery: newMastery, lastPracticed: new Date().toISOString().split('T')[0] } 
          : item
      ));
      
      // Call API to update familiarity
      const response = await vocabularyApi.updateFamiliarity(id, newMastery >= 3); // Consider it "knew" if mastery is 3 or higher
      
      if (!response.success) {
        // If update failed, restore the original vocabulary
        setVocabulary(originalVocabulary);
        throw new Error(response.message || 'Failed to update mastery level');
      }
    } catch (err) {
      console.error('Error updating mastery:', err);
      alert(err.message || 'Failed to update mastery level. Please try again.');
    }
  };

  // Flashcard navigation
  const nextFlashcard = () => {
    setShowFlashcardAnswer(false);
    setCurrentFlashcardIndex((currentFlashcardIndex + 1) % filteredVocabulary.length);
  };

  const prevFlashcard = () => {
    setShowFlashcardAnswer(false);
    setCurrentFlashcardIndex((currentFlashcardIndex - 1 + filteredVocabulary.length) % filteredVocabulary.length);
  };

  const toggleFlashcardMode = () => {
    setFlashcardMode(!flashcardMode);
    setShowFlashcardAnswer(false);
    setCurrentFlashcardIndex(0);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold">Vocabulary Manager</h1>
          
          {!loading && filteredVocabulary.length > 0 && (
            <button
              onClick={toggleFlashcardMode}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              {flashcardMode ? 'Exit Flashcard Mode' : 'Study with Flashcards'}
            </button>
          )}
        </div>
        
        <div className="mb-8">
          <p className="text-lg mb-4">
            Build and manage your personal vocabulary list. Track your progress and review words regularly.
          </p>
        </div>
        
        {/* Flashcard Mode */}
        {flashcardMode && filteredVocabulary.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Flashcard Study Mode</h2>
              <span className="text-gray-500">
                {currentFlashcardIndex + 1} of {filteredVocabulary.length}
              </span>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-6 min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                {showFlashcardAnswer ? (
                  <div>
                    <p className="text-2xl font-bold mb-2">{filteredVocabulary[currentFlashcardIndex].translation}</p>
                    <p className="text-gray-500">{filteredVocabulary[currentFlashcardIndex].notes}</p>
                    
                    {filteredVocabulary[currentFlashcardIndex].examples.length > 0 && (
                      <div className="mt-4 text-left">
                        <p className="text-sm text-gray-600 font-medium">Examples:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                          {filteredVocabulary[currentFlashcardIndex].examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-3xl font-bold">{filteredVocabulary[currentFlashcardIndex].word}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={prevFlashcard}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
              >
                Previous
              </button>
              
              <button
                onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition"
              >
                {showFlashcardAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
              
              <button
                onClick={nextFlashcard}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
              >
                Next
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Rate your knowledge of this word:</p>
              <div className="flex justify-center">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handleUpdateMastery(filteredVocabulary[currentFlashcardIndex].id, level)}
                    className={`w-10 h-10 rounded-full mx-1 flex items-center justify-center ${
                      level <= filteredVocabulary[currentFlashcardIndex].mastery 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-label={`Set mastery level ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-grow">
                  <label htmlFor="search" className="block text-gray-700 font-medium mb-2">Search Words</label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by word or translation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="md:w-1/4">
                  <label htmlFor="filter" className="block text-gray-700 font-medium mb-2">Filter by Category</label>
                  <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="nouns">Nouns</option>
                    <option value="verbs">Verbs</option>
                    <option value="adjectives">Adjectives</option>
                    <option value="adverbs">Adverbs</option>
                    <option value="conjunctions">Conjunctions</option>
                    <option value="prepositions">Prepositions</option>
                    <option value="phrases">Phrases</option>
                  </select>
                </div>
                
                <div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition"
                  >
                    {showAddForm ? 'Cancel' : '+ Add Word'}
                  </button>
                </div>
              </div>
              
              {/* Add Word Form */}
              {showAddForm && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Add New Word</h3>
                  <form onSubmit={handleAddWord}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="newWord" className="block text-gray-700 font-medium mb-2">Word</label>
                        <input
                          type="text"
                          id="newWord"
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="Enter word..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          disabled={submitting}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="newTranslation" className="block text-gray-700 font-medium mb-2">Translation</label>
                        <input
                          type="text"
                          id="newTranslation"
                          value={newTranslation}
                          onChange={(e) => setNewTranslation(e.target.value)}
                          placeholder="Enter translation..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="newNotes" className="block text-gray-700 font-medium mb-2">Notes (Optional)</label>
                      <textarea
                        id="newNotes"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Add any notes, grammar info, etc..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={submitting}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${
                          submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                        } transition-colors`}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Word'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            {/* Vocabulary List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Your Vocabulary</h2>
                  <span className="text-gray-500">{filteredVocabulary.length} words</span>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600">Loading vocabulary...</span>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p>{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredVocabulary.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredVocabulary.map(item => (
                    <div key={item.id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-grow">
                          <div className="flex items-start">
                            <h3 className="text-lg font-medium">{item.word}</h3>
                            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-gray-600">{item.translation}</p>
                          
                          {item.notes && (
                            <p className="text-gray-500 text-sm mt-1">{item.notes}</p>
                          )}
                          
                          {item.examples.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 font-medium">Examples:</p>
                              <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                {item.examples.map((example, index) => (
                                  <li key={index}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            Last practiced: {new Date(item.lastPracticed).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-3 md:mt-0">
                          <div className="mr-4">
                            <p className="text-xs text-gray-500 mb-1">Mastery Level</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(level => (
                                <button
                                  key={level}
                                  onClick={() => handleUpdateMastery(item.id, level)}
                                  className={`w-6 h-6 rounded-full mx-0.5 ${
                                    level <= item.mastery 
                                      ? 'bg-orange-500' 
                                      : 'bg-gray-200'
                                  }`}
                                  aria-label={`Set mastery level ${level}`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteWord(item.id)}
                            className="text-red-500 hover:text-red-700"
                            aria-label="Delete word"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No vocabulary words match your search criteria.</p>
                  {searchTerm || filter !== 'all' ? (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }} 
                      className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <p className="mt-4">
                      Click the "+ Add Word" button to start building your vocabulary.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
