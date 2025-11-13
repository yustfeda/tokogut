
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center p-4 text-gray-500 text-sm mt-8">
      <p>Hak Cipta © {new Date().getFullYear()} TOKOaing. Dilindungi undang-undang.</p>
    </footer>
  );
};

export default Footer;