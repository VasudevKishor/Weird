import React from 'react';
import { useNavigate } from 'react-router-dom';
import DepartmentDirectory from './DeptDirectory';
import './styles/Dashboard.css';
import Navbar from './Navbar';
const API = process.env.REACT_APP_API_BASE_URL;


const DeptDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <Navbar />
    </div>

    <div className="dashboard-directory">
      <DepartmentDirectory />
    </div>
  </div>
</div>

  );
};

export default DeptDashboard;
