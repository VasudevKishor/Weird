import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale } from "chart.js";
const API = process.env.REACT_APP_API_BASE_URL;


ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale);

const FXRateChart = () => {
  const dummyData = {
    labels: [
      "2025-06-07", "2025-06-08", "2025-06-09", "2025-06-10",
      "2025-06-11", "2025-06-12", "2025-06-13"
    ],
    datasets: [
      {
        label: "USD to INR",
        data: [83.2, 83.3, 83.1, 83.5, 83.6, 83.4, 83.7],
        borderColor: "rgba(34, 197, 94, 1)", // green
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "USD to INR - Last 7 Days" },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "INR" },
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  return (
    <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <Line data={dummyData} options={options} />
    </div>
  );
};

export default FXRateChart;
