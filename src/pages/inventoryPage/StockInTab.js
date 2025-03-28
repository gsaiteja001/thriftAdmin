import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
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

export default function StockInTab({ selectedWarehouseId }) {
  const { login, sellerInfo } = useContext(LoginContext); 

  const [date, setDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [transportCharges, setTransportCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [taxes, setTaxes] = useState(0);

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

  // Fetch product data
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
            console.warn(
              `Failed to fetch productId ${resp.productId}: ${resp.error}`
            );
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

  // Generate Batch Number
  const generateBatchNumber = (warehouseId) => {
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,''); 
    return `${warehouseId}-${dateStr}-${Math.floor(Math.random()*1000)}`;
  };

  useEffect(() => {
    if (!batchNumber && selectedWarehouseId) {
      setBatchNumber(generateBatchNumber(selectedWarehouseId));
    }
  }, [batchNumber, selectedWarehouseId]);

  // Add New Item
  // Add New Item - Only Valid Products
const handleAddNewItem = () => {
  if (filteredInventoryItems.length === 0) {
    setSnackbar({
      open: true,
      message: 'No valid products available to add.',
      severity: 'error',
    });
    return;
  }

  // Add the first available valid product from the filtered list
  const inventoryItem = filteredInventoryItems[0]; // Add the first valid product from suggestions
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
      currentStock: inventoryItem.quantityOnHand || 0,
      quantity: 1,
      unitPrice: 0,
      allocatedTransport: 0,
      allocatedOther: 0,
      allocatedTax: 0,
      totalCost: 0,
      finalCutoffUnitPrice: 0,
      notes: '',
    },
  ]);

  setSearchTerm(''); // Clear the search term
  setShowSuggestions(false); // Hide suggestions
  setSnackbar({ open: true, message: `${productName} added to the list.`, severity: 'success' });
};

  // Add Inventory Item from Suggestions
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
        currentStock: inventoryItem.quantityOnHand || 0,
        quantity: 1,
        unitPrice: 0,
        allocatedTransport: 0,
        allocatedOther: 0,
        allocatedTax: 0,
        totalCost: 0,
        finalCutoffUnitPrice: 0,
        notes: '',
      },
    ]);
    setSearchTerm('');
    setShowSuggestions(false);
    setSnackbar({ open: true, message: `${productName} added to the list.`, severity: 'success' });
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    setSnackbar({ open: true, message: 'Item removed.', severity: 'warning' });
  };

  // Handle Quantity Change
  const handleQuantityChange = (id, value) => {
    const qty = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity: qty } : item))
    );
  };

  // Handle Unit Price Change
  const handleUnitPriceChange = (id, value) => {
    const price = parseFloat(value) || 0;
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

  // Distribute Charges and Taxes
  useEffect(() => {
    if (items.length === 0) return;

    const totalSubTotals = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const updated = items.map((item) => {
      const subTotal = item.quantity * item.unitPrice;
      const ratio = totalSubTotals > 0 ? subTotal / totalSubTotals : 0;

      const distributedTransport = transportCharges * ratio;
      const distributedOther = otherCharges * ratio;
      const distributedTax = taxes * ratio;

      const totalCost = subTotal + distributedTransport + distributedOther + distributedTax;

      const finalCutoffUnitPrice =
        item.quantity > 0 ? totalCost / item.quantity : 0;

      return {
        ...item,
        allocatedTransport: distributedTransport,
        allocatedOther: distributedOther,
        allocatedTax: distributedTax,
        totalCost,
        finalCutoffUnitPrice,
      };
    });

    setItems(updated);
  }, [items, transportCharges, otherCharges, taxes]);

  // Handle Submit Stock In
  const handleSubmitStockIn = async () => {
    if (!selectedWarehouseId) {
      setSnackbar({ open: true, message: 'Please select a warehouse first.', severity: 'error' });
      return;
    }
    if (items.length === 0) {
      setSnackbar({ open: true, message: 'No items to stock in.', severity: 'error' });
      return;
    }

    const payload = {
      transactionType: 'stockIn',
      warehouseId: selectedWarehouseId,
      sellerId: sellerInfo.sellerId,
      performedBy: 'AdminUser',
      timestamp: date ? new Date(date) : new Date(),
      batchNumber,
      notes: purchaseNotes,
      paymentMethod,
      totalTransportCharges: Number(transportCharges),
      totalOtherCharges: Number(otherCharges),
      totalTaxes: Number(taxes),
      products: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        allocatedTransport: item.allocatedTransport, 
        allocatedOther: item.allocatedOther,
        allocatedTax: item.allocatedTax,
        totalCost: item.totalCost,
        finalCutoffUnitPrice: item.finalCutoffUnitPrice,
        notes: item.notes
      })),
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/stockTransactions/create`, payload);
      setSnackbar({ open: true, message: 'Stock In transaction recorded successfully!', severity: 'success' });
      // Reset form
      setItems([]);
      setDate('');
      setBatchNumber(generateBatchNumber(selectedWarehouseId));
      setPurchaseNotes('');
      setPaymentMethod('');
      setTransportCharges(0);
      setOtherCharges(0);
      setTaxes(0);
    } catch (error) {
      console.error('Failed to create StockIn transaction', error);
      setSnackbar({ open: true, message: 'Error creating StockIn transaction.', severity: 'error' });
    }
  };

  // Filter suggestions by product name
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
        <h2>Stock In</h2>
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
          label="Batch Number"
          placeholder="Batch #"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          fullWidth
        />

        <TextField
          label="Purchase Notes"
          placeholder="Any purchase note..."
          value={purchaseNotes}
          onChange={(e) => setPurchaseNotes(e.target.value)}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="payment-method-label">Payment Method</InputLabel>
          <Select
            labelId="payment-method-label"
            value={paymentMethod}
            label="Payment Method"
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="CreditCard">Credit Card</MenuItem>
            <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Transport Charges"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={transportCharges}
          onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
          fullWidth
        />

        <TextField
          label="Other Charges"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={otherCharges}
          onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
          fullWidth
        />

        <TextField
          label="Taxes"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={taxes}
          onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
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
          <IconButton color="primary" onClick={handleAddNewItem}>
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        <Tooltip title="Submit Stock In">
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<Save />} 
            onClick={handleSubmitStockIn}
          >
            Submit Stock In
          </Button>
        </Tooltip>
      </Box>

      {/* Items Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: '#1976d2' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>S.No</TableCell>
              <TableCell sx={{ color: '#fff' }}>Item</TableCell>
              <TableCell sx={{ color: '#fff' }}>Size</TableCell>
              <TableCell sx={{ color: '#fff' }}>Current Stock</TableCell>
              <TableCell sx={{ color: '#fff' }}>Quantity</TableCell>
              <TableCell sx={{ color: '#fff' }}>Unit Price</TableCell>
              <TableCell sx={{ color: '#fff' }}>Transport Charges</TableCell>
              <TableCell sx={{ color: '#fff' }}>Other Charges</TableCell>
              <TableCell sx={{ color: '#fff' }}>Taxes</TableCell>
              <TableCell sx={{ color: '#fff' }}>Total Cost</TableCell>
              <TableCell sx={{ color: '#fff' }}>Final Unit Price</TableCell>
              <TableCell sx={{ color: '#fff' }}>Notes</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  No items found. Start by searching or adding new items.
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
                  <TableCell>{item.currentStock ?? 0}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      inputProps={{ min: 1 }}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
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
                    />
                  </TableCell>
                  <TableCell>₹{item.allocatedTransport.toFixed(2)}</TableCell>
                  <TableCell>₹{item.allocatedOther.toFixed(2)}</TableCell>
                  <TableCell>₹{item.allocatedTax.toFixed(2)}</TableCell>
                  <TableCell>₹{item.totalCost.toFixed(2)}</TableCell>
                  <TableCell>₹{item.finalCutoffUnitPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <TextField
                      value={item.notes}
                      onChange={(e) => handleNotesChange(item._id, e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="Add notes..."
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
