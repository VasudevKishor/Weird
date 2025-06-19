import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
);

const API = process.env.REACT_APP_API_BASE_URL;

const BudgetChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/project-budgets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        const projectNames = res.data.map(p => p.name);
        const budgets = res.data.map(p => p.budget);

        setChartData({
          labels: projectNames,
          datasets: [
            {
              label: "", // intentionally removed for clean look
              data: budgets,
              backgroundColor: "rgba(37, 99, 235, 0.7)", // semi-transparent blue
              borderRadius: 6,
              barThickness: 30,
              maxBarThickness: 40
            }
          ]
        });
      })
      .catch(err => console.error("Error fetching chart data", err));
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Project Budget Overview",
        font: {
          size: 20,
          weight: "600",
          family: "Inter, sans-serif"
        },
        color: "#1F2937",
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#ffffff",
        bodyColor: "#E5E7EB",
        titleFont: {
          family: "Inter",
          weight: "600",
          size: 14
        },
        bodyFont: {
          family: "Inter",
          size: 13
        },
        cornerRadius: 6,
        padding: 10
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Project Name",
          color: "#6B7280",
          font: { size: 14, weight: "500" }
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12 }
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: "Budget (in $)",
          color: "#6B7280",
          font: { size: 14, weight: "500" }
        },
        ticks: {
          color: "#6B7280",
          font: { size: 12 }
        },
        grid: {
          color: "#E5E7EB"
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "450px",
        margin: "32px auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px"
      }}
    >
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BudgetChart;
