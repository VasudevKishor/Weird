import React, { useEffect, useState } from 'react';
import './EmployeeHomePage.css';


function EmployeeHomePage() {
  const [employeeName, setEmployeeName] = useState('');
  const userId = localStorage.getItem('userId'); // stored after login
  const token = localStorage.getItem('token');   // if needed for auth

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/${userId}');
        const data = await res.json();
        if (data.name) {
          setEmployeeName(data.name);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return (
    <div className="welcome-container">
      <div className="profile-section">
        <div className="profile-icon1">👤</div>
        <h2 className="employee-name">{employeeName}</h2>
        <p className="welcome-text">Welcome to</p>
      </div>
      <div className="logo"></div>
    </div>
  );
}

export default EmployeeHomePage;