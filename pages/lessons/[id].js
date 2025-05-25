import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import LessonViewer from '../../components/lessons/LessonViewer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function LessonPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/lessons/${id}`);
    }
  }, [user, loading, router, id]);

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
        <LessonViewer lessonId={id} />
      </Layout>
    </ProtectedRoute>
  );
}
