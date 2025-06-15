import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,  // This is the key part
  Tooltip,
  Legend
);
const API = process.env.REACT_APP_API_BASE_URL;


const BudgetChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    axios.get(`${API}/api/project-budgets`)
      .then(res => {
        const projectNames = res.data.map(p => p.name);
        const budgets = res.data.map(p => p.budget);

        setChartData({
          labels: projectNames,
          datasets: [
            {
              label: "Project Budgets",
              data: budgets,
              borderColor: "black",
              backgroundColor: "rgba(0,0,0,0.05)",
              tension: 0.3,
              fill: false,
              pointBackgroundColor: "black"
            }
          ]
        });
      })
      .catch(err => console.error("Error fetching chart data", err));
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "Budget vs Project Name"
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Project Names" }
      },
      y: {
        title: { display: true, text: "Budget" },
        beginAtZero: true
      }
    }
  };

return (
  <div style={{ width: "95%", height: "400px", margin: "0 auto" }}>
    <Line data={chartData} options={options} />
  </div>
);
};

export default BudgetChart;