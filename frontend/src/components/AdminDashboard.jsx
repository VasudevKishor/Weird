import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecentActivities from './RecentActivities';  
import Navbar from './Navbar';
import './styles/AdminDashboard.css';
import DashboardSummary from './DashboardSummary'; // Assuming you have a summary component
const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
<div className="admin-dashboard">
  <div className="dashboard-container">
    <div className="dashboard-header">
      <Navbar />
    </div>
<div className="dashboard-group">
    <div className="dashboard-welcome">
      <DashboardSummary />
    </div>

    <div className="dashboard-directory">
      <RecentActivities />
    </div>
    </div>
  </div>
</div>

  );
};

export default AdminDashboard;
