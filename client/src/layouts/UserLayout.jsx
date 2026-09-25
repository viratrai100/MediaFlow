import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';

/**
 * Public User Layout
 */
export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100 selection:bg-brand-purple/30 selection:text-brand-cyan">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
