import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LearningPhaseTracker from '../components/LearningPhaseTracker';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { vocabularyApi, journalApi, learningApi } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    vocabularyCount: 0,
    lessonsCompleted: 0,
    journalEntries: 0,
    studyStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch user stats and activity
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would be actual API calls
        // For now, we'll simulate the data
        
        // Simulate fetching vocabulary count
        const vocabData = { count: 124 };
        
        // Simulate fetching lessons completed
        const lessonsData = { completed: 8 };
        
        // Simulate fetching journal entries
        const journalData = { count: 12 };
        
        // Simulate fetching study streak
        const streakData = { days: 5 };
        
        // Update stats
        setStats({
          vocabularyCount: vocabData.count,
          lessonsCompleted: lessonsData.completed,
          journalEntries: journalData.count,
          studyStreak: streakData.days
        });
        
        // Simulate recent activity
        setRecentActivity([
          {
            id: 1,
            title: "Completed Lesson: Greetings",
            date: "2 days ago",
            type: "lesson"
          },
          {
            id: 2,
            title: "Added 5 new vocabulary words",
            date: "3 days ago",
            type: "vocabulary"
          },
          {
            id: 3,
            title: "Journal entry: Mi día",
            date: "5 days ago",
            type: "journal"
          }
        ]);
        
        // Simulate recommendations
        setRecommendations([
          {
            id: 1,
            title: "Lesson: Food and Restaurants",
            type: "lesson",
            url: "/lessons/food-restaurants"
          },
          {
            id: 2,
            title: "Review: Time Expressions",
            type: "vocabulary",
            url: "/vocabulary?filter=time"
          },
          {
            id: 3,
            title: "Journal Prompt: Your Favorite Place",
            type: "journal",
            url: "/journal/new?prompt=favorite-place"
          }
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.username || 'Learner'}!
          </h1>
          <p className="mt-2">
            Continue your language learning journey and track your progress.
          </p>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <QuickActionCard 
            title="Start a Lesson" 
            icon="📚" 
            href="/lessons"
            color="bg-green-500"
          />
          <QuickActionCard 
            title="Practice Vocabulary" 
            icon="🔤" 
            href="/vocabulary"
            color="bg-yellow-500"
          />
          <QuickActionCard 
            title="Write in Journal" 
            icon="✏️" 
            href="/journal"
            color="bg-purple-500"
          />
          <QuickActionCard 
            title="Find Immersion Content" 
            icon="🌎" 
            href="/immersion"
            color="bg-red-500"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <LearningPhaseTracker />
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recent Activity</h2>
                <Link href="/activity" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all
                </Link>
              </div>
              
              {loading ? (
                <div className="py-4 text-center text-gray-500">Loading activity...</div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <ActivityItem 
                      key={activity.id}
                      title={activity.title} 
                      date={activity.date}
                      type={activity.type}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">No recent activity</div>
              )}
            </div>
          </div>
          
          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Learning Stats</h2>
              {loading ? (
                <div className="py-4 text-center text-gray-500">Loading stats...</div>
              ) : (
                <div className="space-y-4">
                  <StatItem label="Vocabulary Words" value={stats.vocabularyCount.toString()} />
                  <StatItem label="Lessons Completed" value={stats.lessonsCompleted.toString()} />
                  <StatItem label="Journal Entries" value={stats.journalEntries.toString()} />
                  <StatItem label="Study Streak" value={`${stats.studyStreak} days`} />
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Recommended</h2>
              {loading ? (
                <div className="py-4 text-center text-gray-500">Loading recommendations...</div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map(recommendation => (
                    <RecommendationItem 
                      key={recommendation.id}
                      title={recommendation.title} 
                      type={recommendation.type}
                      url={recommendation.url}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">No recommendations available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function QuickActionCard({ title, icon, href, color }) {
  return (
    <Link href={href} className={`${color} text-white rounded-lg shadow-md p-4 text-center hover:opacity-90 transition-opacity`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-medium">{title}</h3>
    </Link>
  );
}

function ActivityItem({ title, date, type }) {
  const icons = {
    lesson: '📚',
    vocabulary: '🔤',
    journal: '✏️',
    immersion: '🌎'
  };
  
  return (
    <div className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="text-2xl mr-3">{icons[type] || '📝'}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-bold text-blue-600">{value}</span>
    </div>
  );
}

function RecommendationItem({ title, type, url }) {
  const icons = {
    lesson: '📚',
    vocabulary: '🔤',
    journal: '✏️',
    immersion: '🌎'
  };
  
  return (
    <Link href={url} className="flex items-center p-2 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
      <div className="text-xl mr-2">{icons[type] || '📝'}</div>
      <div className="text-sm font-medium">{title}</div>
    </Link>
  );
}
