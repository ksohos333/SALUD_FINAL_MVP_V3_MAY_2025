import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">¡Salud! Language Learning</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Master a new language with our AI-powered learning platform that adapts to your needs
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-md font-bold text-lg transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-md font-bold text-lg transition-colors">
                  Log In
                </Link>
                <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-bold text-lg transition-colors">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How ¡Salud! Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              title="Interactive Lessons" 
              description="Learn through engaging, task-based lessons designed to build practical language skills"
              icon="📚"
              color="bg-blue-500"
            />
            <FeatureCard 
              title="Journaling" 
              description="Practice writing with AI feedback that helps you improve grammar and vocabulary"
              icon="✏️"
              color="bg-purple-500"
            />
            <FeatureCard 
              title="Vocabulary" 
              description="Build your vocabulary with smart flashcards using spaced repetition technology"
              icon="🔤"
              color="bg-yellow-500"
            />
            <FeatureCard 
              title="Immersion" 
              description="Immerse yourself in authentic content tailored to your interests and level"
              icon="🌎"
              color="bg-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Methodology section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Learning Methodology</h2>
            <p className="text-lg text-gray-600">
              ¡Salud! is based on the proven two-phase approach to language acquisition: 
              immersion followed by output practice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <MethodologyCard 
              title="Phase 1: Immersion" 
              description="Build a strong foundation by consuming authentic content in your target language. This creates natural language patterns in your brain."
              number="1"
              color="bg-blue-500"
            />
            <MethodologyCard 
              title="Phase 2: Output" 
              description="Once you've built a foundation, practice producing the language through speaking and writing with AI-powered feedback."
              number="2"
              color="bg-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Testimonials section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="¡Salud! helped me finally break through my language plateau. The immersion approach really works!"
              author="Maria S."
              role="Spanish Learner"
            />
            <TestimonialCard 
              quote="The AI feedback on my journal entries has improved my writing skills dramatically in just a few weeks."
              author="James T."
              role="French Learner"
            />
            <TestimonialCard 
              quote="I love how the platform adapts to my interests. Learning vocabulary through topics I care about makes it stick."
              author="Sophia L."
              role="Italian Learner"
            />
          </div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Language Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are achieving fluency with ¡Salud!'s proven methodology.
          </p>
          
          {isAuthenticated ? (
            <Link href="/dashboard" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md font-bold text-lg transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/register" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md font-bold text-lg transition-colors">
              Sign Up Free
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
      <div className={`${color} text-white text-4xl w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function MethodologyCard({ title, description, number, color }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start">
        <div className={`${color} text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full mr-4 flex-shrink-0`}>
          {number}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-4xl text-gray-300 mb-4">"</div>
      <p className="text-gray-700 mb-4 italic">{quote}</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  );
}
