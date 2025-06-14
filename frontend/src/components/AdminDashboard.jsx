import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecentActivities from './RecentActivities';
import Navbar from './Navbar';
import './styles/AdminDashboard.css';
import DashboardSummary from './DashboardSummary'; // Assuming you have a summary component
import FXRateChart from './FXRateChart';
import BudgetChart from './BudgetChart'; // Assuming you have a budget chart component

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Navbar />
        </div>
        <div className="dashboard-group">
          <div className="dashboard-vertical">
            <div className="dashboard-welcome">
              <DashboardSummary />
            </div>
            <div className="dashboard-welcome1">
              <BudgetChart />
            </div>
          </div>
          <div className="dashboard-directory">
            <RecentActivities />
            <FXRateChart />
          </div>
        </div>
      </div>
    </div>

  );
};

export default AdminDashboard;
