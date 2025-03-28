// src/components/InventoryPage/TransactionsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// React Icons:
import { FaSearch, FaBoxOpen, FaExchangeAlt, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { BiNotepad } from 'react-icons/bi';

const API_BASE_URL = 'http://localhost:8080/api';

export default function TransactionsTab({ selectedWarehouseId }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTx, setFilteredTx] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (!selectedWarehouseId) {
      setTransactions([]);
      setFilteredTx([]);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/stockTransactions`, {
          params: { warehouseId: selectedWarehouseId },
        });
        setTransactions(res.data);
        setFilteredTx(res.data);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      }
    };

    fetchTransactions();
  }, [selectedWarehouseId]);

  /**
   * Filter transactions by search term. For example, search by transactionType or notes.
   */
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredTx(transactions);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const results = transactions.filter((tx) => {
      const typeMatch = tx.transactionType?.toLowerCase().includes(lowerTerm);
      const notesMatch = tx.notes?.toLowerCase().includes(lowerTerm);
      const idMatch = tx.transactionId?.toLowerCase().includes(lowerTerm);
      return typeMatch || notesMatch || idMatch;
    });
    setFilteredTx(results);
  };

  /**
   * Returns a corresponding icon component based on the transaction type.
   */
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'stockIn':
        return <FaBoxOpen style={{ marginRight: 6 }} />;
      case 'stockOut':
        return <FaArrowUp style={{ marginRight: 6 }} />;
      case 'moveStock':
        return <FaExchangeAlt style={{ marginRight: 6 }} />;
      case 'adjust':
        return <FaArrowDown style={{ marginRight: 6 }} />;
      default:
        return <BiNotepad style={{ marginRight: 6 }} />;
    }
  };

  return (
    <div style={styles.container}>
      {/* LEFT PANE - TRANSACTION LIST */}
      <div style={styles.leftPane}>
        <h2 style={styles.headerTitle}>Transactions</h2>

        {/* Search Bar */}
        <div style={styles.searchBarContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Transaction List */}
        <div style={styles.txList}>
          {filteredTx.map((tx) => {
            const isSelected = selectedTx?._id === tx._id;
            return (
              <div
                key={tx._id}
                style={{
                  ...styles.txItem,
                  backgroundColor: isSelected ? '#e3f7ff' : '#f9f9f9',
                  border: isSelected ? '1px solid #1e88e5' : '1px solid #ddd',
                }}
                onClick={() => setSelectedTx(tx)}
              >
                {getTransactionIcon(tx.transactionType)}
                <span style={{ fontWeight: 'bold' }}>
                  {tx.transactionType.charAt(0).toUpperCase() + tx.transactionType.slice(1)}
                </span>
                <span style={styles.txDate}>
                  {new Date(tx.timestamp).toLocaleDateString()}
                </span>
              </div>
            );
          })}
          {filteredTx.length === 0 && (
            <p style={styles.noTxMsg}>No transactions found.</p>
          )}
        </div>
      </div>

      {/* RIGHT PANE - TRANSACTION DETAILS */}
      <div style={styles.rightPane}>
        {selectedTx ? (
          <div style={styles.detailContainer} key={selectedTx._id}>
            <h2 style={styles.detailHeader}>
              Transaction #{selectedTx.transactionId}
            </h2>

            {/* Fade-in animation container */}
            <div style={styles.detailContent}>
              <p style={styles.detailRow}>
                <strong>Type:</strong> {selectedTx.transactionType}
              </p>
              <p style={styles.detailRow}>
                <strong>Date:</strong>{' '}
                {new Date(selectedTx.timestamp).toLocaleString()}
              </p>
              <p style={styles.detailRow}>
                <strong>Notes:</strong> {selectedTx.notes || '—'}
              </p>
              <p style={styles.detailRow}>
                <strong>Performed By:</strong> {selectedTx.performedBy || '—'}
              </p>

              {/* List of products */}
              <h3 style={styles.subHeader}>Products</h3>
              <ul style={styles.productList}>
                {selectedTx.products?.map((prod, idx) => (
                  <li key={idx} style={styles.productItem}>
                    <span style={{ color: '#444' }}>
                      <strong>Product ID:</strong> {prod.productId}
                    </span>
                    <br />
                    <span style={{ color: '#444' }}>
                      <strong>Quantity:</strong> {prod.quantity}
                    </span>
                    <br />
                    <span style={{ color: '#444' }}>
                      <strong>Final Price:</strong> ₹{prod.finalPrice?.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div style={styles.emptyDetails}>
            <p>Select a transaction on the left to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== STYLES =====================
const styles = {
  container: {
    display: 'flex',
    minHeight: '500px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
  },
  leftPane: {
    flex: 1,
    borderRight: '1px solid #ccc',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  headerTitle: {
    margin: '0 0 1rem',
    color: '#333',
  },
  searchBarContainer: {
    position: 'relative',
    marginBottom: '1rem',
  },
  searchIcon: {
    position: 'absolute',
    top: '50%',
    left: '8px',
    transform: 'translateY(-50%)',
    color: '#aaa',
  },
  searchInput: {
    width: '100%',
    padding: '8px 8px 8px 32px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  txList: {
    flex: 1,
    overflowY: 'auto',
    marginTop: '0.5rem',
  },
  txItem: {
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  txDate: {
    marginLeft: 'auto',
    fontStyle: 'italic',
    fontSize: '0.8rem',
    color: '#555',
  },
  noTxMsg: {
    marginTop: '2rem',
    textAlign: 'center',
    color: '#999',
  },
  rightPane: {
    flex: 2,
    padding: '1rem',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  detailContainer: {
    animation: 'fadeIn 0.4s ease forwards',
    backgroundColor: '#fafafa',
    borderRadius: '6px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  detailHeader: {
    margin: '0 0 1rem',
    borderBottom: '1px solid #ddd',
    paddingBottom: '0.5rem',
    color: '#444',
  },
  detailContent: {
    marginTop: '1rem',
  },
  detailRow: {
    marginBottom: '0.5rem',
    color: '#555',
  },
  subHeader: {
    marginTop: '1.5rem',
    color: '#333',
    borderBottom: '1px solid #ddd',
    paddingBottom: '0.25rem',
  },
  productList: {
    listStyle: 'none',
    paddingLeft: 0,
    marginTop: '1rem',
  },
  productItem: {
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s ease',
  },
  emptyDetails: {
    margin: 'auto',
    color: '#666',
    fontStyle: 'italic',
  },

  // Keyframe for fade-in animation
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateX(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
};
