import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentActivities.css';

const UpcomingDeadlines = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/api/projects/upcoming-deadlines`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const topFive = res.data.slice(0, 5);
        setDeadlines(topFive);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch upcoming deadlines", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="recent-activities1">
    <div className="bg-white rounded-[20px] shadow-[0_10px_15px_rgba(0,0,0,0.05)] p-4 w-full h-[300px]">
      <h3>
        Upcoming Deadlines
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500 text-center">Loading...</p>
      ) : deadlines.length > 0 ? (
        <ul className="space-y-2 max-h-[230px] overflow-y-auto px-1">
          {deadlines.map((project) => (
            <li
              key={project.id}
              className="bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md p-2 transition text-xs"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-700 truncate">{project.name} </span>
                <span className="text-[11px] text-gray-500">
                  Deadline: <span className="text-red-600 font-semibold">{project.endDate}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 text-center">No upcoming deadlines in the next 7 days.</p>
      )}
    </div>
    </div>
  );
};

export default UpcomingDeadlines;
