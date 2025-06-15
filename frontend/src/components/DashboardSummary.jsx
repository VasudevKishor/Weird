import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBuilding, FaUsers, FaProjectDiagram, FaSitemap, FaMoneyBillWave } from "react-icons/fa";
import "./DashboardSummary.css";
const API = process.env.REACT_APP_API_BASE_URL;


const DashboardSummary = () => {
  const [stats, setStats] = useState({
    projects: 0,
    employees: 0,
    organisations: 0,
    departments: 0,
    totalBudget: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, employeesRes, orgsRes, deptsRes] = await Promise.all([
          axios.get(`${API}/api/projects`),
          axios.get(`${API}/api/employees`),
          axios.get(`${API}/api/organisations`),
          axios.get(`${API}/api/departments`),
        ]);

        const totalBudget = projectsRes.data.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

        setStats({
          projects: projectsRes.data.length,
          employees: employeesRes.data.length,
          organisations: orgsRes.data.length,
          departments: deptsRes.data.length,
          totalBudget,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchData();
  }, []);

  const cards = [
    {
      title: "Total Projects",
      value: stats.projects,
      icon: <FaProjectDiagram className="icon" />,
      color: "#4e73df",
    },
    {
      title: "Total Employees",
      value: stats.employees,
      icon: <FaUsers className="icon" />,
      color: "#1cc88a",
    },
    {
      title: "Total Organisations",
      value: stats.organisations,
      icon: <FaBuilding className="icon" />,
      color: "#36b9cc",
    },
    {
      title: "Total Departments",
      value: stats.departments,
      icon: <FaSitemap className="icon" />,
      color: "#f6c23e",
    },
    {
      title: "Total Budget (₹)",
      value: `₹${stats.totalBudget.toLocaleString()}`,
      icon: <FaMoneyBillWave className="icon" />,
      color: "#e74a3b",
    },
  ];

  return (
    <div className="dashboard-summary">
      {cards.map((card, index) => (
        <div className="card" key={index} style={{ borderLeftColor: card.color }}>
          <div className="card-body">
            <div className="card-icon" style={{ backgroundColor: card.color }}>
              {card.icon}
            </div>
            <div className="card-text">
              <h4>{card.title}</h4>
              <p>{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummary;
