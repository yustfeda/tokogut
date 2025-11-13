
import React from 'react';
import { IconBox, IconGift, IconTrophy } from '../../constants';

interface HomePageProps {
    setActiveView: (view: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveView }) => {
  return (
    <div className="space-y-12">
      <section className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Welcome to the Mystery Store</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover exclusive items and try your luck with our exciting Mystery Boxes. Every box holds a surprise!
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => setActiveView('register')} className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-700 transition transform hover:scale-105">
            Get Started
          </button>
          <button onClick={() => setActiveView('leaderboard')} className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-300 transition transform hover:scale-105">
            View Leaderboard
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Dummy Product Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <img src="https://picsum.photos/400/300?random=1" alt="Product 1" className="w-full h-56 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Exclusive Gadget</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">A must-have gadget for tech enthusiasts.</p>
              <button onClick={() => setActiveView('login')} className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600">Login to Buy</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <img src="https://picsum.photos/400/300?random=2" alt="Product 2" className="w-full h-56 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Designer Apparel</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Style and comfort combined in one piece.</p>
              <button onClick={() => setActiveView('login')} className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600">Login to Buy</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <img src="https://picsum.photos/400/300?random=3" alt="Product 3" className="w-full h-56 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Limited Edition Collectible</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">A rare item for the dedicated collector.</p>
              <button onClick={() => setActiveView('login')} className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600">Login to Buy</button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Mystery Box Reviews</h2>
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-4 border-l-4 border-indigo-500 bg-gray-50 dark:bg-gray-700">
                <p className="italic">"I won an amazing voucher on my first try! The thrill is incredible. Highly recommended!"</p>
                <p className="text-right font-semibold mt-2">- Alex W.</p>
            </div>
            <div className="p-4 border-l-4 border-indigo-500 bg-gray-50 dark:bg-gray-700">
                <p className="italic">"Didn't win the grand prize, but still got a cool item. The experience itself is worth it. Will definitely play again."</p>
                <p className="text-right font-semibold mt-2">- Jessica P.</p>
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
