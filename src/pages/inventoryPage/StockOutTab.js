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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
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

export default function StockOutTab({ selectedWarehouseId }) {
  const { login, sellerInfo } = useContext(LoginContext);

  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [items, setItems] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch inventory items
  useEffect(() => {
    if (!selectedWarehouseId) return;

    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/Items`, {
          params: { warehouseId: selectedWarehouseId },
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
  }, [selectedWarehouseId]);

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
            .get(`${API_BASE_URL}/products/${pid}`)
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
  }, [inventoryItems]);

  // Generate Batch Number (Optional for Stock Out)
  const generateBatchNumber = (warehouseId) => {
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,''); 
    return `${warehouseId}-${dateStr}-${Math.floor(Math.random()*1000)}`;
  };

  // Add Item to Table from Suggestions
  const handleAddInventoryItem = (inventoryItem) => {
    const newId = Date.now();
    const productInfo = productsMap[inventoryItem.productId];
    const productName = productInfo?.name || `Item #${newId}`;
    const productSize = productInfo?.size || 'N/A';

    setItems((prev) => [
      ...prev,
      {
        _id: newId,
        productId: inventoryItem.productId,
        variantId: inventoryItem.variantId,
        name: productName,
        size: productSize,
        quantityOnHand: inventoryItem.quantityOnHand || 0,
        quantity: 1,
        unitPrice: 0,
        notes: '',
      },
    ]);
    setSearchTerm('');
    setShowSuggestions(false);
    setSnackbar({ open: true, message: `${productName} added to the list.`, severity: 'success' });
  };

  // Manual Add New Row
// Add New Item - Only Valid Products
const handleAddOutItem = () => {
  if (filteredInventoryItems.length === 0) {
    setSnackbar({
      open: true,
      message: 'No valid products available to add.',
      severity: 'error',
    });
    return;
  }

  // Select the first available valid product from the suggestions list
  const inventoryItem = filteredInventoryItems[0]; 
  const productInfo = productsMap[inventoryItem.productId];

  const newId = Date.now();
  const productName = productInfo?.name || `Item #${newId}`;
  const productSize = productInfo?.size || 'N/A';

  setItems((prev) => [
    ...prev,
    {
      _id: newId,
      productId: inventoryItem.productId,
      variantId: inventoryItem.variantId,
      name: productName,
      size: productSize,
      quantityOnHand: inventoryItem.quantityOnHand || 0,
      quantity: 1,
      unitPrice: 0,
      notes: '',
    },
  ]);

  setSearchTerm(''); // Clear the search input
  setShowSuggestions(false); // Hide suggestions dropdown
  setSnackbar({ open: true, message: `${productName} added to the list.`, severity: 'success' });
};


  // Remove Item from Table
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    setSnackbar({ open: true, message: 'Item removed.', severity: 'warning' });
  };

  // Handle Quantity Change
// Handle Quantity Change
const handleQuantityChange = (id, value) => {
  const qty = Math.max(1, Math.min(parseInt(value) || 1, getCurrentStock(id)));
  setItems((prev) =>
    prev.map((item) => 
      item._id === id ? { ...item, quantity: qty } : item
    )
  );
};

// Helper function to get current stock for an item
const getCurrentStock = (id) => {
  const item = items.find((item) => item._id === id);
  return item ? item.quantityOnHand : 0;
};


  // Handle Unit Price Change
  const handleUnitPriceChange = (id, value) => {
    const price = Math.max(0, parseFloat(value) || 0);
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, unitPrice: price } : item))
    );
  };

  // Handle Notes Change
  const handleNotesChange = (id, value) => {
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, notes: value } : item))
    );
  };

  // Calculate Total Price for each item
  const calculateTotalPrice = (unitPrice, quantity) => {
    return (unitPrice * quantity).toFixed(2);
  };

  // Handle Submit Stock Out
  const handleSubmitStockOut = async () => {
    if (!selectedWarehouseId) {
      setSnackbar({ open: true, message: 'Please select a warehouse first.', severity: 'error' });
      return;
    }
    if (items.length === 0) {
      setSnackbar({ open: true, message: 'No items to stock out.', severity: 'error' });
      return;
    }

    const payload = {
      transactionType: 'stockOut',
      warehouseId: selectedWarehouseId,
      sellerId: sellerInfo.sellerId,
      performedBy: 'AdminUser',
      timestamp: date ? new Date(date) : new Date(),
      notes,
      products: items.map((item) => ({
        productId: item.productId || 'mock-productId',
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
      })),
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/stockTransactions/create`, payload);
      console.log('StockOut successful:', res.data);
      setSnackbar({ open: true, message: 'Stock Out transaction recorded successfully!', severity: 'success' });
      // Reset form
      setItems([]);
      setDate('');
      setNotes('');
    } catch (error) {
      console.error('Failed to create StockOut transaction', error);
      setSnackbar({ open: true, message: 'Error creating StockOut transaction.', severity: 'error' });
    }
  };

  // Filter suggestions by product name
// Filter suggestions by product name and exclude already added items
const filteredInventoryItems = inventoryItems.filter((invItem) => {
  const product = productsMap[invItem.productId];
  if (!product) return false;

  const productName = product.name?.toLowerCase() || '';
  
  // Check if the product is already added to the items table
  const alreadyAdded = items.some((item) => item.productId === invItem.productId);
  
  return productName.includes(searchTerm.toLowerCase()) && !alreadyAdded;
});

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Stock Out</h2>
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

      {/* Search & Buttons */}
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
                    onClick={() => handleAddInventoryItem(invItem)}
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

        <Tooltip title="Add New Item">
          <IconButton color="primary" onClick={handleAddOutItem}>
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        <Tooltip title="Submit Stock Out">
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<Save />} 
            onClick={handleSubmitStockOut}
          >
            Submit Stock Out
          </Button>
        </Tooltip>
      </Box>

      {/* Items Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
        <TableHead sx={{ backgroundColor: '#d32f2f' }}>
          <TableRow>
            <TableCell sx={{ color: '#fff' }}>S.No</TableCell>
            <TableCell sx={{ color: '#fff' }}>Item</TableCell>
            <TableCell sx={{ color: '#fff' }}>Size</TableCell>
            <TableCell sx={{ color: '#fff' }}>Current Stock</TableCell> {/* New Column */}
            <TableCell sx={{ color: '#fff' }}>Quantity</TableCell>
            <TableCell sx={{ color: '#fff' }}>Unit Price</TableCell>
            <TableCell sx={{ color: '#fff' }}>Total Price</TableCell>
            <TableCell sx={{ color: '#fff' }}>Notes</TableCell>
            <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No items added. Start by searching or adding new items.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <motion.tr 
                  key={item._id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.name || 'Unnamed'}</TableCell>
                  <TableCell>{item.size || 'N/A'}</TableCell>
                  <TableCell>{item.quantityOnHand || 0}</TableCell> {/* Display Current Stock */}
                  <TableCell>
                    <TextField
                      type="number"
                      inputProps={{ 
                        min: 1, 
                        max: item.quantityOnHand, // Set max to Current Stock
                      }}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ width: '80px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={item.unitPrice}
                      onChange={(e) => handleUnitPriceChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{ width: '100px' }}
                    />
                  </TableCell>
                  <TableCell>₹{calculateTotalPrice(item.unitPrice, item.quantity)}</TableCell>
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
                    <Tooltip title="Remove Item">
                      <IconButton color="error" onClick={() => handleRemoveItem(item._id)}>
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
