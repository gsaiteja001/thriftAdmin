// src/components/InventoryPage/InventoryPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import Calendar CSS
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

import {
  InventoryPageContainer,
  TopSection,
  MapWrapper,
  InventoryDropdown,
  CalendarWrapper,
  TabsContainer,
  TabButton,
  TabContentArea,
} from './styledComponents';

// Import each tab
import StockInTab from './StockInTab';
import StockOutTab from './StockOutTab';
import MoveTab from './MoveTab';
import TransactionsTab from './TransactionsTab';
import InventoryMonitoringTab from './InventoryMonitoringTab';
import ItemsListTab from './ItemsListTab';
import WarehouseDetailsTab from './WarehouseDetailsTab';
import AdjustTab from './AdjustTab'; // Import AdjustTab

import { LoginContext } from '../../context/loginContext';
import { toast } from 'react-toastify'; // If using react-toastify for notifications
import ChangeMapView from './ChangeMapView'; // Import the ChangeMapView component

const API_BASE_URL = 'http://localhost:8080';

// Fixing the default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const selectedIcon = new L.Icon({
  iconUrl: require('../../storeWarehouse.png'), // Provide path to a different marker icon
  iconRetinaUrl: require('../../storeWarehouse.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [35, 45], // Enlarged size
  iconAnchor: [17, 45],
  popupAnchor: [0, -45],
  shadowSize: [45, 45],
});

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('stockIn');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { sellerInfo, loading, error, token } = useContext(LoginContext);
  console.log('sellerInfo:', sellerInfo); // Debugging

  // Fetch all warehouses for the seller
  useEffect(() => {
    if (!sellerInfo || !sellerInfo.sellerId || !token) return;

    const fetchWarehouses = async () => {
      try {
        console.log('Fetching warehouses for sellerId:', sellerInfo.sellerId);
        const res = await axios.get(`${API_BASE_URL}/api/warehouses/${sellerInfo.sellerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setWarehouseList(res.data.data); // Adjusted to match backend response structure
      } catch (error) {
        console.error('Failed to fetch warehouses', error);
        toast.error('Failed to fetch warehouses.'); // Using toast for error notification
      }
    };

    fetchWarehouses();
  }, [sellerInfo, token]);

  // Automatically select the first warehouse when warehouseList is updated
  useEffect(() => {
    if (warehouseList.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouseList[0].warehouseId);
    }
  }, [warehouseList, selectedWarehouse]);

  // Determine map center based on selectedWarehouse
  const selectedWarehouseData = warehouseList.find(
    (wh) => wh.warehouseId === selectedWarehouse
  );

  const mapCenter = selectedWarehouseData
    ? [
        selectedWarehouseData.physicalAddress?.coordinates?.coordinates[1] || 51.505, // Latitude
        selectedWarehouseData.physicalAddress?.coordinates?.coordinates[0] || -0.09, // Longitude
      ]
    : [51.505, -0.09]; // Default to London if selectedWarehouse is not found

  // Handle different states: loading, error, no sellerInfo
  if (loading) {
    return (
      <InventoryPageContainer>
        <p>Loading seller information...</p>
      </InventoryPageContainer>
    );
  }

  if (error) {
    return (
      <InventoryPageContainer>
        <p>Error: {error}</p>
      </InventoryPageContainer>
    );
  }

  if (!sellerInfo) {
    return (
      <InventoryPageContainer>
        <p>No seller information available. Please log in.</p>
      </InventoryPageContainer>
    );
  }

  const sellerId = sellerInfo.sellerId; // Safely access sellerId now that sellerInfo is confirmed

  return (
    <InventoryPageContainer>
      {/* TOP SECTION: Map + Calendar */}
      <TopSection>
        {/* MAP SECTION */}
        <MapWrapper>
          <InventoryDropdown
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            
            {warehouseList.map((wh) => (
              <option key={wh.warehouseId} value={wh.warehouseId}>
                {wh.warehouseName}
              </option>
            ))}
          </InventoryDropdown>
          <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
            {/* ChangeMapView updates the map's center dynamically */}
            <ChangeMapView center={mapCenter} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {warehouseList.map((wh) => (
              <Marker
                key={wh.warehouseId}
                position={[
                  wh.physicalAddress?.coordinates?.coordinates[1] || 51.505, // Latitude with fallback
                  wh.physicalAddress?.coordinates?.coordinates[0] || -0.09, // Longitude with fallback
                ]}
                icon={wh.warehouseId === selectedWarehouse ? selectedIcon : new L.Icon.Default()}
              >
                <Popup>
                  <strong>{wh.warehouseName}</strong>
                  <br />
                  {wh.physicalAddress.addressLine1}, {wh.physicalAddress.city}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </MapWrapper>

        {/* CALENDAR SECTION */}
        <CalendarWrapper>
          <h4 style={{ textAlign: 'center' }}>Calendar</h4>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="custom-calendar" // Optional: Add custom class for styling
          />
        </CalendarWrapper>
      </TopSection>

      {/* TABS */}
      <TabsContainer>
        <TabButton active={activeTab === 'stockIn'} onClick={() => setActiveTab('stockIn')}>
          Stock In
        </TabButton>
        <TabButton active={activeTab === 'stockOut'} onClick={() => setActiveTab('stockOut')}>
          Stock Out
        </TabButton>
        <TabButton active={activeTab === 'move'} onClick={() => setActiveTab('move')}>
          Move
        </TabButton>
        <TabButton
          active={activeTab === 'transactions'}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </TabButton>
        <TabButton
          active={activeTab === 'inventoryMonitoring'}
          onClick={() => setActiveTab('inventoryMonitoring')}
        >
          Inventory Monitoring
        </TabButton>
        <TabButton active={activeTab === 'itemsList'} onClick={() => setActiveTab('itemsList')}>
          Items List
        </TabButton>
        <TabButton
          active={activeTab === 'warehouseDetails'}
          onClick={() => setActiveTab('warehouseDetails')}
        >
          Warehouse Details
        </TabButton>
        <TabButton
          active={activeTab === 'adjust'}
          onClick={() => setActiveTab('adjust')}
        >
          Adjust
        </TabButton>
      </TabsContainer>

      {/* TAB CONTENT */}
      <TabContentArea>
        {activeTab === 'stockIn' && <StockInTab selectedWarehouseId={selectedWarehouse} />}
        {activeTab === 'stockOut' && <StockOutTab selectedWarehouseId={selectedWarehouse} />}
        {activeTab === 'move' && <MoveTab selectedWarehouseId={selectedWarehouse} />}
        {activeTab === 'transactions' && <TransactionsTab selectedWarehouseId={selectedWarehouse} />}
        {activeTab === 'inventoryMonitoring' && (
          <InventoryMonitoringTab selectedWarehouseId={selectedWarehouse} />
        )}
        {activeTab === 'itemsList' && <ItemsListTab selectedWarehouseId={selectedWarehouse} />}
        {activeTab === 'warehouseDetails' && (
          <WarehouseDetailsTab
            sellerId={sellerId}
            warehouseId={selectedWarehouse}
            refreshWarehouses={() => {
              // Optional: Function to refresh warehouses after update
              axios
                .get(`${API_BASE_URL}/api/warehouses/${sellerId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                })
                .then((res) => setWarehouseList(res.data.data))
                .catch((err) => {
                  console.error('Failed to refresh warehouses', err);
                  toast.error('Failed to refresh warehouses.');
                });
            }}
          />
        )}
        {activeTab === 'adjust' && <AdjustTab selectedWarehouseId={selectedWarehouse} />} {/* Render AdjustTab */}
      </TabContentArea>
    </InventoryPageContainer>
  );
}
