import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold">¡Salud!</Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-orange-200 transition">Home</Link>
          <Link href="/lessons" className="hover:text-orange-200 transition">Lessons</Link>
          <Link href="/journal" className="hover:text-orange-200 transition">Journal</Link>
          <Link href="/vocabulary" className="hover:text-orange-200 transition">Vocabulary</Link>
          <Link href="/immersion" className="hover:text-orange-200 transition">Immersion</Link>
        </nav>
        
        {/* Authentication links */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="hover:text-orange-200 transition">Dashboard</Link>
              <button 
                onClick={logout}
                className="bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-orange-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-orange-200 transition">Login</Link>
              <Link href="/auth/register" className="bg-white text-orange-600 px-4 py-2 rounded-md hover:bg-orange-100 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-orange-600 px-4 py-2">
          <nav className="flex flex-col space-y-2 pb-3">
            <Link href="/" className="hover:text-orange-200 transition py-2">Home</Link>
            <Link href="/lessons" className="hover:text-orange-200 transition py-2">Lessons</Link>
            <Link href="/journal" className="hover:text-orange-200 transition py-2">Journal</Link>
            <Link href="/vocabulary" className="hover:text-orange-200 transition py-2">Vocabulary</Link>
            <Link href="/immersion" className="hover:text-orange-200 transition py-2">Immersion</Link>
            
            <div className="pt-2 border-t border-orange-500">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="block hover:text-orange-200 transition py-2">Dashboard</Link>
                  <button 
                    onClick={logout}
                    className="w-full text-left hover:text-orange-200 transition py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block hover:text-orange-200 transition py-2">Login</Link>
                  <Link href="/auth/register" className="block hover:text-orange-200 transition py-2">Sign Up</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
