import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">¡Salud!</h3>
            <p className="text-orange-200">Your journey to language fluency</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2">
              <li><Link href="/lessons" className="text-gray-300 hover:text-orange-200">Lessons</Link></li>
              <li><Link href="/journal" className="text-gray-300 hover:text-orange-200">Journal</Link></li>
              <li><Link href="/vocabulary" className="text-gray-300 hover:text-orange-200">Vocabulary</Link></li>
              <li><Link href="/immersion" className="text-gray-300 hover:text-orange-200">Immersion</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-orange-200">About Us</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-orange-200">FAQ</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-orange-200">Contact</Link></li>
              <li><Link href="/pricing" className="text-gray-300 hover:text-orange-200">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-orange-200">Twitter</a></li>
              <li><a href="#" className="text-gray-300 hover:text-orange-200">Facebook</a></li>
              <li><a href="#" className="text-gray-300 hover:text-orange-200">Instagram</a></li>
              <li><a href="#" className="text-gray-300 hover:text-orange-200">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} ¡Salud! Language Learning. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
