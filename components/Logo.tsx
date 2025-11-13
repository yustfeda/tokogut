import React from 'react';
import { IconBox } from '../constants';

// Untuk mengubah logo, ganti konten di bawah ini.
// Anda bisa menggunakan tag <img> atau SVG lainnya.
// Contoh: return <img src="/path/to/your/logo.png" alt="TOKOaing Logo" className="h-8 w-auto" />

const Logo: React.FC = () => {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 text-xl font-bold">
      <IconBox className="text-gray-800 dark:text-white" />
      <span className="text-gray-800 dark:text-white">
        <span className="text-yellow-500">TOKO</span>
        <span className="text-blue-500">aing</span>
      </span>
    </div>
  );
};

export default Logo;
