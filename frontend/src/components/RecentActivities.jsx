import React, { useEffect, useState } from "react";
import { ActivityIcon, UsersIcon } from "lucide-react";
import axios from "axios";
import {
  UserPlus,
  Building2,
  Briefcase,
  LayoutDashboard,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import "./RecentActivities.css"; // optional external styling

const API = process.env.REACT_APP_API_BASE_URL;

const iconMap = {
  Employee: <UserPlus className="icon" />,
  Department: <Building2 className="icon" />,
  Organisation: <Briefcase className="icon" />,
  Project: <LayoutDashboard className="icon" />,
};

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/recent-activities`)
      .then((res) => {
        setActivities(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load activities.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="recent-activities">
      <h3>Recent Activities</h3>

      {loading && (
        <div className="loading">
          <Loader2 className="icon spin" /> Loading...
        </div>
      )}

      {error && (
        <div className="error">
          <AlertTriangle className="icon" /> {error}
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <p>No recent activity yet.</p>
      )}

<ul className="custom-list">
  {activities.map((activity, index) => (
    <li key={index} className="activity">
      <div className="content">
        <p className="timestamp">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
    </li>
  ))}
</ul>

    </div>
  );
};

export default RecentActivities;
