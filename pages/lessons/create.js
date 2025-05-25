import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import LessonCreator from '../../components/lessons/LessonCreator';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateLessonPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/lessons/create');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/lessons">
              <a className="text-blue-600 hover:text-blue-800 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Lessons
              </a>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-8 text-center">Create a New Lesson</h1>
          
          <div className="mb-8">
            <p className="text-lg text-center max-w-2xl mx-auto">
              Create a custom language lesson tailored to your needs. Choose between interactive language lessons 
              or subject-based immersion lessons where you learn academic subjects in your target language.
            </p>
          </div>
          
          <LessonCreator />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
