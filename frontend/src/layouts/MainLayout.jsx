import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Your existing Navbar
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500 text-gray-900 dark:text-white">
      {/* Navbar stays at the top of every page */}
      <Navbar />

      {/* This is where Home.jsx or Items.jsx will render */}
      <main className="grow">
        <Outlet />
      </main>

      {/* Footer stays at the bottom of every page */}
      <Footer />
    </div>
  );
};

export default MainLayout;