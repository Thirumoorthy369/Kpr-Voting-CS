import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Colors);

const RolePieChart = ({ roleData }) => {
  const data = {
    labels: roleData.candidates.map(c => c.name),
    datasets: [
      {
        data: roleData.candidates.map(c => c.votes || 0),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(79, 70, 229, 0.8)',
          'rgba(67, 56, 202, 0.8)',
          'rgba(55, 48, 163, 0.8)',
          'rgba(49, 46, 129, 0.8)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(79, 70, 229, 1)',
          'rgba(67, 56, 202, 1)',
          'rgba(55, 48, 163, 1)',
          'rgba(49, 46, 129, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: roleData.name,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    }
  };

  return (
    <div className="role-pie-chart">
      <div className="chart-container">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default RolePieChart;
