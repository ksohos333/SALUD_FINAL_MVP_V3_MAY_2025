import React from 'react';
import SampleV0Component from '../components/v0/SampleV0Component';

// This is a demo page showing how V0-generated components could be integrated
export default function V0Demo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">V0 Integration Demo</h1>
      
      <p className="mb-8 text-lg">
        This page demonstrates how components generated with V0 can be integrated into the Salud Language Learning Platform.
        After connecting your project to V0, you can replace these placeholder components with actual V0-generated components.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <SampleV0Component 
          title="Language Learning" 
          description="Enhance your language skills with our interactive lessons and exercises."
          primaryColor="blue"
          ctaText="Explore Lessons"
        />
        
        <SampleV0Component 
          title="AI-Powered Feedback" 
          description="Get personalized feedback on your writing and speaking to improve faster."
          primaryColor="green"
          ctaText="Try Journal"
        />
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">How to Use V0 with This Project</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Create a new project in V0 (https://v0.dev/)</li>
          <li>Link your GitHub repository to V0</li>
          <li>Use the V0 interface to generate components based on your requirements</li>
          <li>Export the generated components to your project</li>
          <li>Import and use the components in your pages</li>
        </ol>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Example V0 Component Integration</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`// Example of importing and using a V0-generated component
import MyV0Component from '../components/v0/MyV0Component';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <MyV0Component 
        title="Welcome to Salud!"
        description="Learn languages effectively with our platform"
      />
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

// Placeholder component to demonstrate V0 integration
function DemoV0Component({ title, description, type }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
            {type === 'card' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        {type === 'form' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your email" />
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">Submit</button>
          </div>
        )}
        
        {type === 'card' && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Customizable design</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Responsive layout</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Accessible design</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
