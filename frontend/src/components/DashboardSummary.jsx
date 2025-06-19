import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBuilding, FaUsers, FaProjectDiagram, FaSitemap, FaMoneyBillWave } from "react-icons/fa";
import "./DashboardSummary.css";
const API = process.env.REACT_APP_API_BASE_URL;


const DashboardSummary = () => {
  const token = localStorage.getItem('token');
  const [organisationName, setOrganisationName] = useState('');
  const [stats, setStats] = useState({
    projects: 0,
    employees: 0,
    organisations: 0,
    departments: 0,
    totalBudget: 0,
    organisationName: "", // add this
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [projectsRes, employeesRes, orgsRes, deptsRes, orgNameRes] = await Promise.all([
          axios.get(`${API}/api/projects`, headers),
          axios.get(`${API}/api/employees`, headers),
          axios.get(`${API}/api/organisations`, headers),
          axios.get(`${API}/api/departments`, headers),
          axios.get(`${API}/api/organisation-name`, headers), // NEW
        ]);



        const totalBudget = projectsRes.data.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

        setStats({
          projects: projectsRes.data.length,
          employees: employeesRes.data.length,
          organisations: orgsRes.data.length,
          departments: deptsRes.data.length,
          totalBudget,
          organisationName: orgNameRes.data.name,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/organisation-name`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setOrganisationName(res.data.name);
      })
      .catch(err => console.error("Error fetching organisation name:", err));
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
    /*{
      title: "Total Organisations",
      value: stats.organisations,
      icon: <FaBuilding className="icon" />,
      color: "#36b9cc",
    },*/
    {
      title: "Total Departments",
      value: stats.departments,
      icon: <FaSitemap className="icon" />,
      color: "#f6c23e",
    },
    {
      title: "Total Budget ($)",
      value: `$${stats.totalBudget.toLocaleString()}`,
      icon: <FaMoneyBillWave className="icon" />,
      color: "#e74a3b",
    },
  ];

  return (
    <div className="dashboard-summary">
      <h2 className="org-heading">Organisation: {stats.organisationName}</h2>

      <div className="summary-cards">
        {cards.map((card, index) => (
          <div className="card" key={index} style={{ borderLeftColor: card.color }}>
            <div className="card-body">
              <div className="card-icon1" style={{ backgroundColor: card.color }}>
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
    </div>
  );

};

export default DashboardSummary;
