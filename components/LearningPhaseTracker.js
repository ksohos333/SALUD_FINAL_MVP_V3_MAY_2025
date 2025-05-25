import { useState, useEffect } from 'react';
import { learningApi } from '../lib/api';

export default function LearningPhaseTracker() {
  const [learningPhase, setLearningPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  // Fetch the user's learning phase data
  useEffect(() => {
    const fetchLearningPhase = async () => {
      setLoading(true);
      setError(null);
      
      const response = await learningApi.getLearningPhase();
      
      if (response.success) {
        setLearningPhase(response.phase);
      } else {
        console.error('Error fetching learning phase:', response.message);
        setError(response.message || 'Failed to fetch learning phase data');
        
        // Fallback to a default learning phase if API fails
        setLearningPhase({
          phase_type: 'immersion',
          immersion_hours: 10,
          target_immersion_hours: 50,
          is_ready_for_output: false
        });
      }
      
      setLoading(false);
    };

    const fetchRecentSessions = async () => {
      const response = await learningApi.getImmersionSessions();
      
      if (response.success) {
        setRecentSessions(response.sessions || []);
      } else {
        console.error('Error fetching immersion sessions:', response.message);
        // Set some sample sessions as fallback
        setRecentSessions([
          {
            id: 1,
            session_type: 'listening',
            duration_minutes: 45,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            session_type: 'reading',
            duration_minutes: 30,
            created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
          }
        ]);
      }
    };

    fetchLearningPhase();
    fetchRecentSessions();
  }, []);

  // Function to advance to output phase
  const advanceToOutputPhase = async () => {
    if (!learningPhase || !learningPhase.is_ready_for_output) {
      return;
    }

    setLoading(true);
    setError(null);
    
    const response = await learningApi.advanceLearningPhase();
    
    if (response.success) {
      setLearningPhase(response.phase);
    } else {
      console.error('Error advancing learning phase:', response.message);
      setError(response.message || 'Failed to advance learning phase');
    }
    
    setLoading(false);
  };

  // Function to log a new immersion session
  const logImmersionSession = async (sessionData) => {
    setLoading(true);
    setError(null);
    
    const response = await learningApi.createImmersionSession(sessionData);
    
    if (response.success) {
      // Update learning phase if returned
      if (response.phase) {
        setLearningPhase(response.phase);
      }
      
      // Add the new session to the recent sessions list
      if (response.session) {
        setRecentSessions(prevSessions => [response.session, ...prevSessions.slice(0, 4)]);
      }
      
      return true;
    } else {
      console.error('Error logging immersion session:', response.message);
      setError(response.message || 'Failed to log immersion session');
      return false;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading learning phase data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!learningPhase) {
    return <div className="p-4 text-center">No learning phase data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Your Learning Journey</h2>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              learningPhase.phase_type === 'immersion' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            <span className="text-lg font-medium">
              Current Phase: <span className="text-blue-600 capitalize">{learningPhase.phase_type}</span>
            </span>
          </div>
          {learningPhase.phase_type === 'immersion' && (
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              {learningPhase.immersion_hours.toFixed(1)} / {learningPhase.target_immersion_hours} hours
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        {learningPhase.phase_type === 'immersion' && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${Math.min(100, (learningPhase.immersion_hours / learningPhase.target_immersion_hours) * 100)}%` }}
            ></div>
          </div>
        )}
        
        {/* Phase description */}
        <div className="text-gray-700 mb-4">
          {learningPhase.phase_type === 'immersion' ? (
            <p>
              You are in the <strong>Immersion Phase</strong>. Focus on consuming content in your target language to build a strong foundation.
              Once you reach {learningPhase.target_immersion_hours} hours of immersion, you can advance to the Output Phase.
            </p>
          ) : (
            <p>
              You are in the <strong>Output Phase</strong>. Now that you have a strong foundation through immersion,
              focus on producing the language through speaking and writing exercises.
            </p>
          )}
        </div>
        
        {/* Advance button */}
        {learningPhase.phase_type === 'immersion' && learningPhase.is_ready_for_output && (
          <button
            onClick={advanceToOutputPhase}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Advance to Output Phase
          </button>
        )}
      </div>
      
      {/* Log immersion session form */}
      {learningPhase.phase_type === 'immersion' && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">Log Immersion Session</h3>
            <div className="text-sm text-gray-600">
              Track your language exposure time
            </div>
          </div>
          <LogImmersionForm onSubmit={logImmersionSession} />
        </div>
      )}
      
      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-xl font-semibold mb-3">Recent Immersion Sessions</h3>
          <div className="space-y-2">
            {recentSessions.map(session => (
              <div key={session.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium capitalize">{session.session_type}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-blue-600 font-medium">
                  {(session.duration_minutes / 60).toFixed(1)} hours
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Form component for logging immersion sessions
function LogImmersionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    duration_minutes: 30,
    session_type: 'listening',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    
    try {
      await onSubmit(formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        duration_minutes: 30,
        session_type: 'listening',
        notes: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200 mb-4">
          Session logged successfully!
        </div>
      )}
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700 mb-1">
            Session Type
          </label>
          <div className="relative">
            <select
              id="session_type"
              name="session_type"
              value={formData.session_type}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              required
            >
              <option value="listening">Listening</option>
              <option value="reading">Reading</option>
              <option value="watching">Watching</option>
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {formData.session_type === 'listening' && <span>🎧</span>}
              {formData.session_type === 'reading' && <span>📚</span>}
              {formData.session_type === 'watching' && <span>📺</span>}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <div className="relative">
            <input
              type="number"
              id="duration_minutes"
              name="duration_minutes"
              min="1"
              max="480"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span>⏱️</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.floor(formData.duration_minutes / 60) > 0 && `${Math.floor(formData.duration_minutes / 60)} hour(s) `}
            {formData.duration_minutes % 60 > 0 && `${formData.duration_minutes % 60} minute(s)`}
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="What did you listen to/read/watch? How was the experience?"
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <button
        type="submit"
        disabled={submitting}
        className={`${
          submitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center`}
      >
        {submitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging...
          </>
        ) : (
          'Log Session'
        )}
      </button>
    </form>
  );
}
