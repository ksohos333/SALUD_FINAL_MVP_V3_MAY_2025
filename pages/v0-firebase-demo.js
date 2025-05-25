import React from 'react';
import V0FirebaseForm from '../components/v0/V0FirebaseForm';

export default function V0FirebaseDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">V0 + Firebase Integration Demo</h1>
      
      <p className="mb-8 text-lg">
        This page demonstrates how to integrate V0-styled components with Firebase Firestore.
        The form below will save data to your Firestore database when submitted.
      </p>
      
      <V0FirebaseForm />
      
      <div className="mt-12 bg-orange-50 p-6 rounded-lg border border-orange-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-orange-800">How V0 + Firebase Integration Works</h2>
        <ol className="list-decimal pl-5 space-y-2 text-orange-900">
          <li>The form component imports Firebase/Firestore functions from our firebase.js file</li>
          <li>When the form is submitted, it creates a unique document ID</li>
          <li>Form data is saved to the "language_learners" collection in Firestore</li>
          <li>The submission includes a timestamp for when it was submitted</li>
          <li>Success/error messages are displayed to the user</li>
        </ol>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">V0 + Firebase Configuration</h2>
        <p className="mb-4">
          This demo combines the visual design from V0 with Firebase backend functionality:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Orange gradient theme from V0</li>
          <li>Responsive form layout</li>
          <li>Form validation</li>
          <li>Loading states during submission</li>
          <li>Success/error feedback</li>
          <li>Data storage in Firestore</li>
        </ul>
      </div>
    </div>
  );
}
