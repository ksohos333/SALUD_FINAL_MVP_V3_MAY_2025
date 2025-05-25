import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { journalApi } from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function Journal() {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const router = useRouter();

  // Fetch journal entries on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to get journal entries
        const response = await journalApi.getEntries();
        
        if (response.success) {
          setEntries(response.entries || []);
        } else {
          throw new Error(response.message || 'Failed to load journal entries');
        }
      } catch (err) {
        console.error('Error fetching journal entries:', err);
        setError('Failed to load journal entries. Please try again later.');
        
        // Fallback to mock data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data as fallback in development');
          const mockEntries = [
            {
              id: '20250308123456',
              content: 'Hoy fui al mercado y compré frutas y verduras. El vendedor era muy amable y me ayudó a elegir las mejores manzanas. Después, caminé por el parque y disfruté del sol.',
              language: 'Spanish',
              timestamp: '2025-03-08T12:34:56',
              feedback: {
                grammar: 'Tu gramática es buena. Recuerda que "fui" es el pretérito de "ir".',
                vocabulary: 'Podrías usar "productos frescos" en lugar de "frutas y verduras" para variar tu vocabulario.',
                cultural: 'En muchos países hispanohablantes, los mercados al aire libre son muy comunes y una parte importante de la vida diaria.',
                fluency: 'Tu escritura muestra un buen nivel de fluidez para un estudiante intermedio.'
              }
            },
            {
              id: '20250307093012',
              content: 'Ayer estudié español por dos horas. Aprendí nuevos verbos y practiqué la conjugación. Es difícil pero interesante.',
              language: 'Spanish',
              timestamp: '2025-03-07T09:30:12',
              feedback: {
                grammar: 'Buen uso del pretérito "estudié" y "aprendí".',
                vocabulary: 'Podrías ampliar tu vocabulario usando "conjugación verbal" en lugar de solo "conjugación".',
                cultural: 'El español tiene muchas conjugaciones verbales comparado con el inglés, lo que refleja la riqueza del idioma.',
                fluency: 'Tu entrada es clara y concisa. Buen trabajo.'
              }
            },
            {
              id: '20250306143022',
              content: 'Hoy practiqué mi español con un amigo. Hablamos sobre películas y música. Todavía cometo errores, pero estoy mejorando poco a poco.',
              language: 'Spanish',
              timestamp: '2025-03-06T14:30:22',
              feedback: {
                grammar: 'Buen uso del pretérito y presente. Considera practicar más el uso de preposiciones.',
                vocabulary: 'Buen vocabulario básico. Intenta incorporar más adjetivos descriptivos.',
                cultural: 'Las conversaciones sobre cine y música son excelentes para practicar idiomas y aprender sobre la cultura.',
                fluency: 'Tu escritura muestra progreso. Sigue practicando la construcción de frases más complejas.'
              }
            }
          ];
          
          setEntries(mockEntries);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create entry data
      const entryData = {
        content,
        language,
        id: editingEntry ? editingEntry.id : undefined
      };
      
      // Create temporary entry for optimistic UI update
      const tempEntry = {
        id: editingEntry ? editingEntry.id : new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
        content,
        language,
        timestamp: editingEntry ? editingEntry.timestamp : new Date().toISOString(),
        feedback: {
          grammar: 'Procesando...',
          vocabulary: 'Procesando...',
          cultural: 'Procesando...',
          fluency: 'Procesando...'
        }
      };
      
      // Optimistic UI update
      if (editingEntry) {
        // Update existing entry
        const updatedEntries = entries.map(entry => 
          entry.id === editingEntry.id ? tempEntry : entry
        );
        setEntries(updatedEntries);
      } else {
        // Add new entry
        setEntries([tempEntry, ...entries]);
      }
      
      // Reset form
      setContent('');
      setEditingEntry(null);
      
      // Call API to create/update entry
      const response = await journalApi.createEntry(entryData);
      
      if (response.success) {
        // Update entries with the response from the server
        const serverEntry = response.entry;
        
        setEntries(currentEntries => {
          if (editingEntry) {
            // Replace the temporary entry with the server response
            return currentEntries.map(entry => 
              entry.id === serverEntry.id ? serverEntry : entry
            );
          } else {
            // Remove the temporary entry and add the server response
            const filteredEntries = currentEntries.filter(entry => entry.id !== tempEntry.id);
            return [serverEntry, ...filteredEntries];
          }
        });
      } else {
        throw new Error(response.message || 'Failed to save journal entry');
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save your journal entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setContent(entry.content);
    setLanguage(entry.language);
    setEditingEntry(entry);
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Optimistic UI update
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      setEntries(updatedEntries);
      
      // If we were editing this entry, reset the form
      if (editingEntry && editingEntry.id === entryId) {
        setContent('');
        setLanguage('Spanish');
        setEditingEntry(null);
      }
      
      // Call API to delete entry
      const response = await journalApi.deleteEntry(entryId);
      
      if (!response.success) {
        // If deletion failed, restore the entry
        const deletedEntry = entries.find(entry => entry.id === entryId);
        if (deletedEntry) {
          setEntries(current => [...current, deletedEntry]);
        }
        throw new Error(response.message || 'Failed to delete journal entry');
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      alert('Failed to delete journal entry. Please try again.');
    }
  };

  const cancelEdit = () => {
    setContent('');
    setLanguage('Spanish');
    setEditingEntry(null);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Language Journal</h1>
        
        <div className="mb-8">
          <p className="text-lg mb-4">
            Practice your writing skills and get AI-powered feedback on your grammar, 
            vocabulary, and cultural insights.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h3>
              
              {editingEntry && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="language" className="block text-gray-700 font-medium mb-2">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                Your Journal Entry
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Write your thoughts in ${language}...`}
                required
                disabled={submitting}
              />
              <div className="mt-1 text-right text-sm text-gray-500">
                {content.length} characters
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className={`flex items-center justify-center w-full md:w-auto px-6 py-2 rounded-md text-white font-medium ${
                submitting || !content.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingEntry ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editingEntry ? 'Update Entry' : 'Submit Entry'
              )}
            </button>
          </form>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Journal Entries</h2>
          
          <div className="text-sm text-gray-600">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading journal entries...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">You haven't created any journal entries yet.</p>
            <p className="text-gray-600">Start writing in your target language to get AI-powered feedback!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <JournalEntry 
                key={entry.id} 
                entry={entry} 
                onEdit={() => handleEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function JournalEntry({ entry, onEdit, onDelete }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if feedback is still processing
  const isProcessing = Object.values(entry.feedback).some(value => value === 'Procesando...');
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {entry.language}
            </span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Entry options"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onEdit();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onDelete();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-800 mb-4 whitespace-pre-line">{entry.content}</p>
        
        <div className="flex items-center">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Feedback...
              </>
            ) : (
              <>
                {showFeedback ? 'Hide Feedback' : 'Show Feedback'}
                <svg 
                  className={`ml-1 h-4 w-4 transform transition-transform ${showFeedback ? 'rotate-180' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
          
          <div className="ml-auto text-sm text-gray-500">
            {entry.content.length} characters
          </div>
        </div>
        
        {showFeedback && !isProcessing && (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold mb-2">AI Feedback</h4>
            <div className="space-y-3">
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center mb-1">
                  <svg className="h-4 w-4 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  <span className="font-medium">Grammar:</span>
                </div>
                <p className="ml-6">{entry.feedback.grammar}</p>
              </div>
              
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center mb-1">
                  <svg className="h-4 w-4 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L9.586 9 6.293 5.707a1 1 0 010-1.414A1 1 0 017 4z" />
                    <path d="M13 4a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L15.586 9 12.293 5.707a1 1 0 010-1.414A1 1 0 0113 4z" />
                  </svg>
                  <span className="font-medium">Vocabulary:</span>
                </div>
                <p className="ml-6">{entry.feedback.vocabulary}</p>
              </div>
              
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center mb-1">
                  <svg className="h-4 w-4 text-yellow-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Cultural Insights:</span>
                </div>
                <p className="ml-6">{entry.feedback.cultural}</p>
              </div>
              
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center mb-1">
                  <svg className="h-4 w-4 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span className="font-medium">Fluency Assessment:</span>
                </div>
                <p className="ml-6">{entry.feedback.fluency}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
