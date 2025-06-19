import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDirectory from './EmployeeDirectory';
import './styles/Dashboard.css';
import Navbar from './Navbar';
const API = process.env.REACT_APP_API_BASE_URL;


const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <Navbar />
    </div>

    <div className="dashboard-directory">
      <EmployeeDirectory />
    </div>
  </div>
</div>

  );
};

export default EmployeeDashboard;