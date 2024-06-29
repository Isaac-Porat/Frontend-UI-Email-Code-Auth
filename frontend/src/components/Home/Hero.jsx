import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

const Hero = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center bg-gray-50">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left side content */}
            <div className="w-full md:w-1/2 text-left mb-8 md:mb-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-900">
                Production-ready scalable SaaS products
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8">
                Unlock your business potential with our production-ready scalable SaaS products designed to streamline your operations and drive growth
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <button className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold shadow-lg hover:bg-green-700 transition duration-300 ease-in-out flex items-center justify-center">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                ) : (
                  <>
                    <button className="px-6 py-3 bg-white text-green-600 rounded-full font-semibold shadow-lg hover:bg-opacity-90 transition duration-300 ease-in-out flex items-center justify-center">
                      Learn more
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold shadow-lg hover:bg-green-700 transition duration-300 ease-in-out flex items-center justify-center">
                      Get started
                      <Sparkles className="ml-2 h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right side image */}
            <div className="w-full md:w-1/2 flex justify-center">
              <img
                src="/api/placeholder/600/400"
                alt="SaaS Product Illustration"
                className="rounded-lg shadow-xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;