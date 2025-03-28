import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Tooltip, 
  Snackbar, 
  Alert 
} from '@mui/material';
import { 
  AddCircleOutline, 
  Delete, 
  Search, 
  Save 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LoginContext } from '../../context/loginContext';

const API_BASE_URL = 'http://localhost:8080/api';

export default function AdjustTab({ selectedWarehouseId }) {
  const { sellerInfo, token } = useContext(LoginContext);

  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [adjustments, setAdjustments] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch inventory items for the selected warehouse
  useEffect(() => {
    if (!selectedWarehouseId) return;

    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/Items`, {
          params: { warehouseId: selectedWarehouseId },
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const fetchedInventoryItems = res.data.data || [];
        setInventoryItems(fetchedInventoryItems);
        console.log('Fetched inventoryItems:', fetchedInventoryItems);
      } catch (error) {
        console.error('Failed to fetch warehouse inventory items', error);
        setSnackbar({ open: true, message: 'Failed to fetch inventory items.', severity: 'error' });
      }
    };

    fetchItems();
  }, [selectedWarehouseId, token]);

  // Fetch product data for each unique productId
  useEffect(() => {
    if (!inventoryItems || inventoryItems.length === 0) return;

    const fetchProductData = async () => {
      try {
        const uniqueProductIds = [
          ...new Set(inventoryItems.map((inv) => inv.productId)),
        ];

        const requests = uniqueProductIds.map((pid) =>
          axios
            .get(`${API_BASE_URL}/products/${pid}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
            .then((response) => ({
              success: true,
              productId: pid,
              data: response.data,
            }))
            .catch((error) => ({
              success: false,
              productId: pid,
              error: error.response?.data?.message || error.message,
            }))
        );

        const responses = await Promise.all(requests);

        const productMap = {};
        responses.forEach((resp) => {
          if (resp.success && resp.data?.productId) {
            productMap[resp.data.productId] = resp.data;
          } else {
            console.warn(`Failed to fetch productId ${resp.productId}: ${resp.error}`);
            productMap[resp.productId] = null;
          }
        });

        setProductsMap(productMap);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setSnackbar({ open: true, message: 'Error fetching product data.', severity: 'error' });
      }
    };

    fetchProductData();
  }, [inventoryItems, token]);

  // Add Adjustment to Table from Suggestions
  const handleAddAdjustment = (inventoryItem) => {
    const productInfo = productsMap[inventoryItem.productId];
    const productName = productInfo?.name || 'Unnamed Product';
    const productSize = productInfo?.size || 'N/A';

    // Store the *real* InventoryItem _id here:
    setAdjustments((prev) => [
      ...prev,
      {
        _id: inventoryItem._id, // real Mongo _id
        productId: inventoryItem.productId,
        variantId: inventoryItem.variantId,
        name: productName,
        size: productSize,
        quantityOnHand: inventoryItem.quantityOnHand || 0,
        newStockLevel: inventoryItem.stockLevel || 0, // Initialize with current stockLevel
        notes: '',
      },
    ]);

    setSearchTerm('');
    setShowSuggestions(false);
    setSnackbar({ open: true, message: `${productName} added to the adjustments.`, severity: 'success' });
  };

  // Remove Adjustment from Table
  const handleRemoveAdjustment = (id) => {
    setAdjustments((prev) => prev.filter((item) => item._id !== id));
    setSnackbar({ open: true, message: 'Adjustment removed.', severity: 'warning' });
  };

  // Handle New Stock Level Change
  const handleNewStockLevelChange = (id, value) => {
    const newLevel = parseInt(value) || 0;
    setAdjustments((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, newStockLevel: newLevel } : item
      )
    );
  };

  // Handle Notes Change
  const handleNotesChange = (id, value) => {
    setAdjustments((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, notes: value } : item
      )
    );
  };

  // Handle Submit Adjustments
  const handleSubmitAdjustments = async () => {
    if (!selectedWarehouseId) {
      setSnackbar({ open: true, message: 'Please select a warehouse first.', severity: 'error' });
      return;
    }
    if (adjustments.length === 0) {
      setSnackbar({ open: true, message: 'No adjustments to submit.', severity: 'error' });
      return;
    }
  
    const payload = {
      transactionType: 'setStockLevel',
      warehouseId: selectedWarehouseId,
      sellerId: sellerInfo.sellerId,
      performedBy: 'AdminUser',
      timestamp: date ? new Date(date) : new Date(),
      notes,
      adjustments: adjustments.map((item) => ({
        // Now we pass the real `_id` from the InventoryItem
        _id: item._id,
        newStockLevel: item.newStockLevel,
        notes: item.notes || '',
      })),
    };
  
    try {
      const res = await axios.post(`${API_BASE_URL}/inventory/setStockLevels`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Stock levels updated successfully:', res.data);
      setSnackbar({ open: true, message: 'Stock levels updated successfully!', severity: 'success' });
      // Reset form
      setAdjustments([]);
      setDate('');
      setNotes('');
      // Optionally, refresh inventory items if you want the UI updated
      // e.g., by re-calling setInventoryItems or re-fetching them
    } catch (error) {
      console.error('Failed to update stock levels', error);
      setSnackbar({ open: true, message: 'Error updating stock levels.', severity: 'error' });
    }
  };

  // Filter suggestions by product name and exclude already added adjustments
  const filteredInventoryItems = inventoryItems.filter((invItem) => {
    const product = productsMap[invItem.productId];
    if (!product) return false;

    const productName = product.name?.toLowerCase() || '';
    // Check if product is already added to adjustments
    const alreadyAdded = adjustments.some((item) => item.productId === invItem.productId);

    return productName.includes(searchTerm.toLowerCase()) && !alreadyAdded;
  });

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Adjust Stock Levels</h2>
      </motion.div>

      {/* Top Form */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          marginBottom: 4,
          backgroundColor: '#fff',
          padding: 3,
          borderRadius: 2,
          boxShadow: 1
        }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
        />

        <TextField
          label="Notes"
          placeholder="Notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
        />
      </Box>

      {/* Search & Submit */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ position: 'relative', flexGrow: 1 }}>
          <TextField
            label="Search Item"
            placeholder="Search item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            fullWidth
            InputProps={{
              endAdornment: <Search />,
            }}
          />
          {showSuggestions && filteredInventoryItems.length > 0 && (
            <Paper 
              sx={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                maxHeight: 200, 
                overflowY: 'auto',
                zIndex: 10 
              }}
            >
              {filteredInventoryItems.map((invItem) => {
                const product = productsMap[invItem.productId];
                const productName = product?.name || 'Unnamed Product';
                return (
                  <Box
                    key={invItem._id}
                    onClick={() => handleAddAdjustment(invItem)}
                    sx={{ 
                      padding: 1, 
                      cursor: 'pointer', 
                      '&:hover': { backgroundColor: '#f0f0f0' } 
                    }}
                  >
                    {productName} {product?.size ? `(${product.size})` : ''}
                  </Box>
                );
              })}
            </Paper>
          )}
        </Box>

        <Tooltip title="Add Adjustment">
          <IconButton
            color="primary"
            onClick={() => {
              if (filteredInventoryItems.length > 0) {
                handleAddAdjustment(filteredInventoryItems[0]);
              } else {
                setSnackbar({
                  open: true,
                  message: 'No valid products available to add.',
                  severity: 'error',
                });
              }
            }}
          >
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        <Tooltip title="Submit Adjustments">
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<Save />} 
            onClick={handleSubmitAdjustments}
          >
            Submit Adjustments
          </Button>
        </Tooltip>
      </Box>

      {/* Adjustments Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: '#388e3c' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>S.No</TableCell>
              <TableCell sx={{ color: '#fff' }}>Item</TableCell>
              <TableCell sx={{ color: '#fff' }}>Size</TableCell>
              <TableCell sx={{ color: '#fff' }}>Current Stock</TableCell>
              <TableCell sx={{ color: '#fff' }}>New Stock Level</TableCell>
              <TableCell sx={{ color: '#fff' }}>Notes</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {adjustments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No adjustments added. Start by searching or adding new items.
                </TableCell>
              </TableRow>
            ) : (
              adjustments.map((item, idx) => (
                <motion.tr 
                  key={item._id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  style={{ backgroundColor: idx % 2 === 0 ? '#e8f5e9' : '#f1f8e9' }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.name || 'Unnamed'}</TableCell>
                  <TableCell>{item.size || 'N/A'}</TableCell>
                  <TableCell>{item.quantityOnHand || 0}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.newStockLevel}
                      onChange={(e) => handleNewStockLevelChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ width: '120px' }}
                      InputProps={{
                        startAdornment: <span style={{ marginRight: '5px' }}>#</span>,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={item.notes}
                      onChange={(e) => handleNotesChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="Add notes..."
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove Adjustment">
                      <IconButton color="error" onClick={() => handleRemoveAdjustment(item._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar Notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
