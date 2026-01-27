import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="overflow-auto flex-1 bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;