import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState({
    vendorName: 'John\'s Store',  // Example name, replace as needed
    totalUsers: 0,
    totalSales: 0,
    totalCollections: 0,
    totalProducts: 0,
    pendingShipments: 0,
    reviewsAwaitingApproval: 0,
    todayOrders: 0,
    environmentalImpacts: {
      co2: 0,
      trees: 0,
      energy: 0,
    },
    recentOrders: [],  // Will hold array of order objects
    activities: [],     // Will hold array of activity/notification objects
  });

  useEffect(() => {
    // Fetch data from your server
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.example.com/dashboard-data');
        const result = await response.json();
        // Below is just an example structure; adapt to your actual API fields:
        setData({
          vendorName: result.vendorName || 'John\'s Store',
          totalUsers: result.totalUsers || 356,
          totalSales: result.totalSales || 12340,
          totalCollections: result.totalCollections || 580,
          totalProducts: result.totalProducts || 90,
          pendingShipments: result.pendingShipments || 7,
          reviewsAwaitingApproval: result.reviewsAwaitingApproval || 3,
          todayOrders: result.todayOrders || 15,
          environmentalImpacts: {
            co2: result.environmentalImpacts?.co2 || 45,
            trees: result.environmentalImpacts?.trees || 70,
            energy: result.environmentalImpacts?.energy || 30,
          },
          recentOrders: result.recentOrders || [
            { id: 101, customer: 'Alice', total: 45.0, status: 'Processing' },
            { id: 102, customer: 'Bob', total: 72.5, status: 'Shipped' },
          ],
          activities: result.activities || [
            { id: 1, message: 'Low stock alert: Product #1245' },
            { id: 2, message: 'New review pending approval' },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fall back to sample local data if needed
        setData((prev) => ({
          ...prev,
          vendorName: 'John\'s Store',
          totalUsers: 356,
          totalSales: 12340,
          totalCollections: 580,
          totalProducts: 90,
          pendingShipments: 7,
          reviewsAwaitingApproval: 3,
          todayOrders: 15,
          environmentalImpacts: { co2: 45, trees: 70, energy: 30 },
          recentOrders: [
            { id: 101, customer: 'Alice', total: 45.0, status: 'Processing' },
            { id: 102, customer: 'Bob', total: 72.5, status: 'Shipped' },
          ],
          activities: [
            { id: 1, message: 'Low stock alert: Product #1245' },
            { id: 2, message: 'New review pending approval' },
          ],
        }));
      }
    };

    fetchData();
  }, []);

  // === Chart Configuration (Sample Data) ===
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales ($)',
        data: [200, 450, 300, 600, 800, 750, 1000], // Example data
        fill: false,
        borderColor: '#8B26C2',
        tension: 0.2,
        pointBackgroundColor: '#8B26C2',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Weekly Sales Overview',
        color: '#2b292b',
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#2b292b' },
      },
      x: {
        ticks: { color: '#2b292b' },
      },
    },
  };

  // === STYLES ===
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#faf9fc',
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    background: 'linear-gradient(45deg, #D873F5, #8B26C2)',
    color: '#ffffff',
    padding: '20px',
    textAlign: 'center',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
  };

  const subtitleStyle = {
    marginTop: '5px',
    fontSize: '1rem',
    opacity: 0.8,
  };

  const mainContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    flex: '1',
  };

  // Grid for top-level stats
  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  };

  const statsCardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    color: '#2b292b',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const statsNumberStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
  };

  const statsLabelStyle = {
    margin: 0,
    fontSize: '0.9rem',
    marginTop: '5px',
    color: '#666',
  };

  const sectionStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    color: '#2b292b',
  };

  // Environmental impact circles
  const impactContainerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px',
  };

  const circleContainerStyle = {
    width: '100px',
    height: '100px',
    textAlign: 'center',
  };

  const ordersTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const ordersTableHeaderCellStyle = {
    textAlign: 'left',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  };

  const ordersTableCellStyle = {
    padding: '8px',
    borderBottom: '1px solid #eee',
  };

  const activityListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };

  const activityListItemStyle = {
    backgroundColor: '#f7f7f7',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Welcome back, {data.vendorName}!</h1>
        <p style={subtitleStyle}>
          Here’s your next eco-friendly goal: Reduce plastic packaging by 25%!
        </p>
      </header>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Top-level Statistic Cards */}
        <div style={statsGridStyle}>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>
              ₹{data.totalSales.toLocaleString()}
            </p>
            <p style={statsLabelStyle}>Total Sales</p>
          </div>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>{data.todayOrders}</p>
            <p style={statsLabelStyle}>Today’s Orders</p>
          </div>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>{data.pendingShipments}</p>
            <p style={statsLabelStyle}>Pending Shipments</p>
          </div>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>{data.totalProducts}</p>
            <p style={statsLabelStyle}>Total Products</p>
          </div>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>{data.reviewsAwaitingApproval}</p>
            <p style={statsLabelStyle}>Reviews Awaiting Approval</p>
          </div>
          <div style={statsCardStyle}>
            <p style={statsNumberStyle}>{data.environmentalImpacts.trees}</p>
            <p style={statsLabelStyle}>Trees Planted</p>
          </div>
        </div>

        {/* Sales Graph */}
        <div style={sectionStyle}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Order Overview Table */}
        <div style={sectionStyle}>
          <h3>Latest Orders</h3>
          <table style={ordersTableStyle}>
            <thead>
              <tr>
                <th style={ordersTableHeaderCellStyle}>Order ID</th>
                <th style={ordersTableHeaderCellStyle}>Customer</th>
                <th style={ordersTableHeaderCellStyle}>Total</th>
                <th style={ordersTableHeaderCellStyle}>Status</th>
                <th style={ordersTableHeaderCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={ordersTableCellStyle}>{order.id}</td>
                    <td style={ordersTableCellStyle}>{order.customer}</td>
                    <td style={ordersTableCellStyle}>
                      ${order.total.toFixed(2)}
                    </td>
                    <td style={ordersTableCellStyle}>{order.status}</td>
                    <td style={ordersTableCellStyle}>
                      {/* Example link to Order Details */}
                      <a href={`/orders/${order.id}`}>View Details</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={ordersTableCellStyle} colSpan="5">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Activity Feed and Environmental Impact */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Activity Feed / Quick Notifications */}
          <div style={{ flex: '1', minWidth: '280px' }}>
            <div style={sectionStyle}>
              <h3>Activity & Notifications</h3>
              <ul style={activityListStyle}>
                {data.activities.length > 0 ? (
                  data.activities.map((activity) => (
                    <li key={activity.id} style={activityListItemStyle}>
                      {activity.message}
                    </li>
                  ))
                ) : (
                  <li style={activityListItemStyle}>
                    No new activities or notifications.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Environmental Impact Progress */}
          <div style={{ flex: '1', minWidth: '280px' }}>
            <div style={sectionStyle}>
              <h3>Environmental Impacts</h3>
              <div style={impactContainerStyle}>
                <div style={circleContainerStyle}>
                  <CircularProgressbar
                    value={data.environmentalImpacts.co2}
                    text={`${data.environmentalImpacts.co2}%`}
                    styles={buildStyles({
                      textColor: '#f7c8f9',
                      pathColor: '#f7c8f9',
                    })}
                  />
                  <p style={{ marginTop: '5px' }}>CO2 Reduction</p>
                </div>
                <div style={circleContainerStyle}>
                  <CircularProgressbar
                    value={data.environmentalImpacts.trees}
                    text={`${data.environmentalImpacts.trees}%`}
                    styles={buildStyles({
                      textColor: '#e6f9c8',
                      pathColor: '#e6f9c8',
                    })}
                  />
                  <p style={{ marginTop: '5px' }}>Trees Planted</p>
                </div>
                <div style={circleContainerStyle}>
                  <CircularProgressbar
                    value={data.environmentalImpacts.energy}
                    text={`${data.environmentalImpacts.energy}%`}
                    styles={buildStyles({
                      textColor: '#c8f9f7',
                      pathColor: '#c8f9f7',
                    })}
                  />
                  <p style={{ marginTop: '5px' }}>Energy Saved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
