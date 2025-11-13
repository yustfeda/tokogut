
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Product } from '../../types';
import { Spinner } from '../../components/Spinner';

interface HomePageProps {
    setActiveView: (view: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveView }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const listener = onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const productList: Product[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setProducts(productList.filter(p => p.isAvailable && p.stock > 0).slice(0, 3)); // Show first 3 available products
        setLoading(false);
    });
    return () => off(productsRef, 'value', listener);
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Selamat Datang di <span className="text-yellow-500">TOKO</span><span className="text-blue-500">aing</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Temukan barang-barang eksklusif dan uji keberuntunganmu dengan Mystery Box kami yang menarik. Setiap kotak berisi kejutan!
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => setActiveView('register')} className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-full text-lg font-semibold hover:bg-yellow-600 transition transform hover:scale-105">
            Mulai Sekarang
          </button>
          <button onClick={() => setActiveView('leaderboard')} className="bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 transition transform hover:scale-105">
            Lihat Papan Peringkat
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Produk Tersedia</h2>
        {loading ? (
          <div className="flex justify-center"><Spinner /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length > 0 ? products.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" onError={(e) => { e.currentTarget.src = 'https://picsum.photos/400/300' }}/>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 h-20 overflow-hidden">{product.description}</p>
                  <button onClick={() => setActiveView('login')} className="w-full bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md hover:bg-yellow-600">Masuk untuk Membeli</button>
                </div>
              </div>
            )) : <p className="text-center col-span-3">Saat ini tidak ada produk yang tersedia.</p>}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Ulasan Mystery Box</h2>
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-4 border-l-4 border-yellow-500 bg-gray-50 dark:bg-gray-700">
                <p className="italic">"Saya memenangkan voucher luar biasa pada percobaan pertama! Sensasinya luar biasa. Sangat direkomendasikan!"</p>
                <p className="text-right font-semibold mt-2">- Alex W.</p>
            </div>
            <div className="p-4 border-l-4 border-yellow-500 bg-gray-50 dark:bg-gray-700">
                <p className="italic">"Tidak memenangkan hadiah utama, tapi tetap dapat barang keren. Pengalamannya sendiri sangat berharga. Pasti akan main lagi."</p>
                <p className="text-right font-semibold mt-2">- Jessica P.</p>
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;