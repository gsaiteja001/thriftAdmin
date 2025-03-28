import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useNavigate } from 'react-router-dom';

// Icon images (replace with your own or import from your assets)
import ShoppingOrders from '../shoppingOrders.png';
import Inventory from '../inventory.png';

// Dummy placeholders for demonstration (replace with your real icons or logic)
const locationIcons = {
  e_commerce: new L.Icon({
    iconUrl: ShoppingOrders,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  inventory: new L.Icon({
    iconUrl: Inventory,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
};

function Updater({ newLocation }) {
  const map = useMap();

  // Whenever newLocation changes,
  // you can programmatically setView here
  useEffect(() => {
    if (map && newLocation) {
      map.setView(newLocation, 13);
    }
  }, [map, newLocation]);

  return null; // this component just runs the effect
}

const OrderList = () => {
  // ---------------------- States ----------------------
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mapLocations, setMapLocations] = useState([]);
  const [inventoryLocations, setInventoryLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([51.505, -0.09]);
  const mapRef = useRef();

  const navigate = useNavigate();

  // ---------------------- Effects (API calls) ----------------------
  useEffect(() => {
    fetchOrders();
    fetchInventoryLocations();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
    // eslint-disable-next-line
  }, [orders, searchQuery, statusFilter, sortOption, startDate, endDate]);

  // ---------------------- Fetchers ----------------------
  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `https://recycle-backend-apao.onrender.com/getreCommerceOrders`
      );
      const data = response.data.orderslist;

      const ordersData = Array.isArray(data)
        ? data.map((order) => {
            const orderLocation =
              Array.isArray(order.location) && order.location.length > 0
                ? order.location[0]
                : {};
            return {
              id: order.id,
              userId: order.userId,
              username: order.name,
              contact: order.contact,
              date: order.date,
              fulfillmentDate: order.fulfillmentDate,
              address: orderLocation.address || '',
              location: {
                lat: orderLocation.lat,
                lng: orderLocation.lng,
              },
              totalPrice: order.totalPrice,
              status: order.status, // e.g. "pending", "processing", "shipped", "delivered", "returned"
            };
          })
        : [];

      setOrders(ordersData);
      setMapLocations(
        ordersData.map((order) => ({
          lat: order.location.lat,
          lng: order.location.lng,
        }))
      );
      setFilteredOrders(ordersData); // initial
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInventoryLocations = async () => {
    try {
      const eCommerceResponse = await axios.get(
        'https://recycle-backend-apao.onrender.com/api/inventories/type/e_commerce'
      );
      const bothResponse = await axios.get(
        'https://recycle-backend-apao.onrender.com/api/inventories/type/both'
      );

      const combinedInventory = [
        ...eCommerceResponse.data,
        ...bothResponse.data,
      ];
      setInventoryLocations(
        combinedInventory.map((inv) => ({
          id: inv.id,
          name: inv.name,
          lat: inv.location.latitude,
          lng: inv.location.longitude,
        }))
      );
    } catch (error) {
      console.error('Error fetching inventory locations:', error);
    }
  };

  // ---------------------- Filters & Sorting ----------------------
  const applyFiltersAndSorting = () => {
    let updatedOrders = [...orders];

    // 1. Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      updatedOrders = updatedOrders.filter(
        (o) =>
          o.username.toLowerCase().includes(query) ||
          o.id.toLowerCase().includes(query) ||
          (o.userId && o.userId.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      updatedOrders = updatedOrders.filter((o) => o.status === statusFilter);
    }

    // 3. Date Range Filter
    if (startDate) {
      updatedOrders = updatedOrders.filter(
        (o) => new Date(o.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      updatedOrders = updatedOrders.filter(
        (o) => new Date(o.date) <= new Date(endDate)
      );
    }

    // 4. Sorting
    // "newest" => descending by date
    // "oldest" => ascending by date
    // "highest" => by totalPrice descending
    // "lowest" => by totalPrice ascending
    if (sortOption === 'newest') {
      updatedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'oldest') {
      updatedOrders.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === 'highest') {
      updatedOrders.sort((a, b) => b.totalPrice - a.totalPrice);
    } else if (sortOption === 'lowest') {
      updatedOrders.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    setFilteredOrders(updatedOrders);
  };

  // ---------------------- Handlers ----------------------
  const handleLocateMeClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentLocation(newLocation);
  
          // Now you can call setView
          const map = mapRef.current;
          if (map) {
            map.setView(newLocation, 13);
          }
        },
        (error) => {
          console.error('Error getting current location: ', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };
  

  const handleOrderClick = (orderId) => {
    console.log("Navigating to OrderDetails with orderId:", orderId);
    navigate(`/ecommerce/OrderDetails/${orderId}`);
  };
  

  // ---------------------- Utility for Status Badge ----------------------
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#FFD700', color: '#000' }; // Gold
      case 'processing':
        return { backgroundColor: '#36A2EB', color: '#fff' }; // Blue
      case 'shipped':
        return { backgroundColor: '#FFA500', color: '#fff' }; // Orange
      case 'delivered':
        return { backgroundColor: '#28A745', color: '#fff' }; // Green
      case 'returned':
        return { backgroundColor: '#DC3545', color: '#fff' }; // Red
      default:
        return { backgroundColor: '#6c757d', color: '#fff' }; // Gray
    }
  };

  // ---------------------- Rendering ----------------------
  return (
    <div style={styles.pageContainer}>
      {/* Page Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Order List</h1>
        <div style={styles.filterContainer}>
          {/* Status Filter */}
          <select
            style={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </select>

          {/* Sort Option */}
          <select
            style={styles.select}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Sort by Newest</option>
            <option value="oldest">Sort by Oldest</option>
            <option value="highest">Sort by Highest Total</option>
            <option value="lowest">Sort by Lowest Total</option>
          </select>

          {/* Date Range Filter */}
          <label style={styles.label}>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.dateInput}
            />
          </label>
          <label style={styles.label}>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.dateInput}
            />
          </label>

          {/* Search */}
          <div style={styles.searchWrapper}>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by name, user ID, or order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={styles.searchButton} onClick={applyFiltersAndSorting}>
              🔍
            </button>
          </div>
        </div>
      </header>

      <div style={styles.content}>
        {/* Left Column: Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer Name</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Total Amount</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={styles.tr}>
                  <td
                    style={styles.tdClickable}
                    onClick={() => handleOrderClick(order.id)}
                  >
                    {order.id}
                  </td>
                  <td style={styles.td}>{order.username}</td>
                  <td style={styles.td}>{new Date(order.date).toLocaleString()}</td>
                  <td style={styles.td}>₹{order.totalPrice?.toFixed(2) || 0}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...getStatusBadgeStyle(order.status),
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Map */}
        <div style={styles.mapSection}>
          <h2 style={styles.mapTitle}>Map View</h2>
          <div style={styles.mapContainer}>
          <MapContainer
            center={currentLocation}
            zoom={13}
            style={styles.mapInner}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {/* E-Commerce Markers */}
              {mapLocations.map((loc, index) => {
                const lat = parseFloat(loc.lat);
                const lng = parseFloat(loc.lng);
                if (
                  isNaN(lat) ||
                  isNaN(lng) ||
                  lat < -90 ||
                  lat > 90 ||
                  lng < -180 ||
                  lng > 180
                ) {
                  return null;
                }
                return (
                  <Marker
                    key={`order-loc-${index}`}
                    position={[lat, lng]}
                    icon={locationIcons.e_commerce}
                  >
                    <Popup>
                      <p>
                        Order Location:
                        <br />
                        lat: {lat}, lng: {lng}
                      </p>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Inventory Markers */}
              {inventoryLocations.map((inv) => (
                <Marker
                  key={`inv-${inv.id}`}
                  position={[inv.lat, inv.lng]}
                  icon={locationIcons.inventory}
                >
                  <Popup>
                    <p>
                      Inventory: {inv.name}
                      <br />
                      lat: {inv.lat}, lng: {inv.lng}
                    </p>
                  </Popup>
                </Marker>
              ))}
              <Updater newLocation={currentLocation} />
            </MapContainer>
          </div>
          <button style={styles.locateButton} onClick={handleLocateMeClick}>
            Locate Me
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------- Gorgeous Inline Styles ----------------------
const styles = {
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9fc',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    backgroundColor: '#fff',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  title: {
    fontSize: '1.8rem',
    margin: 0,
  },
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
  },
  select: {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.9rem',
    marginRight: '10px',
  },
  dateInput: {
    marginTop: '4px',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    padding: '8px',
    borderRadius: '6px 0 0 6px',
    border: '1px solid #ccc',
    outline: 'none',
    flex: '1',
  },
  searchButton: {
    padding: '8px 16px',
    borderRadius: '0 6px 6px 0',
    border: '1px solid #8ce08a',
    backgroundColor: '#8ce08a',
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    gap: '20px',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    paddingBottom: '10px',
    color: '#333',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '8px 0',
    fontSize: '0.95rem',
    color: '#555',
  },
  tdClickable: {
    padding: '8px 0',
    fontSize: '0.95rem',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    minWidth: '80px',
    textAlign: 'center',
  },
  mapSection: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  mapTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  mapContainer: {
    height: '300px',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
  },
  mapInner: {
    height: '100%',
    width: '100%',
  },
  locateButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#8ce08a',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default OrderList;
