// src/components/UserLogoutBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserLogoutBar = () => {
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName'); // assume it's stored on login

  const handleLogout = () => {
    // Clear the stored token and username
    localStorage.removeItem('token');
    localStorage.removeItem('userName');

    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="flex justify-end items-center p-4 bg-gray-100 shadow-md">
      <span className="text-gray-800 font-semibold mr-4">
        Welcome, {userName || 'User'}
      </span>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default UserLogoutBar;
