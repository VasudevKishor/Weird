import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrganisationDirectory from './OrganisationDirectory'; // updated import
import Navbar from './Navbar';
import './styles/Dashboard.css';

const OrganisationDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
      <Navbar />
    </div>

        <div className="dashboard-directory">
          <OrganisationDirectory /> 
        </div>
      </div>
    </div>
  );
};

export default OrganisationDashboard;