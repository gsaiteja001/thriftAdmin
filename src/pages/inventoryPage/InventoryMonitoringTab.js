// src/components/InventoryPage/InventoryMonitoringTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API_BASE_URL = 'http://localhost:8080/api';

/* Styled Components */
const Card = styled.div`
  flex: 1 1 250px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const ProductImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 150px;
  background-color: #eee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1rem;
`;

const ProgressBarContainer = styled.div`
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ProgressBar = styled.div`
  width: ${({ width }) => width}%;
  background: ${({ isBelowReorder }) => (isBelowReorder ? '#e74c3c' : '#2AB674')};
  height: 100%;
  transition: width 0.3s;
`;

const WarningText = styled.div`
  color: #e74c3c;
  font-weight: bold;
`;

export default function InventoryMonitoringTab({ selectedWarehouseId }) {
  const [items, setItems] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inventory items
  useEffect(() => {
    if (!selectedWarehouseId) return;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/inventory/Items`, {
          params: { warehouseId: selectedWarehouseId },
        });
        setItems(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch inventory items for monitoring', error);
        setError('Failed to fetch inventory items.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedWarehouseId]);

  // Fetch product details after inventory items are fetched
  useEffect(() => {
    if (items.length === 0) return;

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Extract unique productIds
        const uniqueProductIds = [...new Set(items.map((item) => item.productId))];

        // Fetch product data in parallel
        const productRequests = uniqueProductIds.map((pid) =>
          axios.get(`http://localhost:8080/api/products/${pid}`)
        );

        const productResponses = await Promise.all(productRequests);

        // Create a mapping of productId to product data
        const productMap = {};
        productResponses.forEach((response) => {
          const product = response.data;
          if (product && product.productId) {
            productMap[product.productId] = product;
          }
        });

        setProductsMap(productMap);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [items]);

  // Helper to get variant details
  const getVariantDetails = (item) => {
    const product = productsMap[item.productId] || {};
    const matchedVariant = (product.variants || []).find(
      (v) => v.variantId === item.variantId
    );

    if (matchedVariant) {
      const { size, color, weight, volume } = matchedVariant.variantType || {};
      return [size, color, weight, volume].filter(Boolean).join(' / ');
    }

    // Fallback if variant details are not found
    return item.variantId || 'N/A';
  };

  if (loading) {
    return <div>Loading inventory data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h2>Inventory Monitoring</h2>
      <p style={{ marginBottom: '1rem' }}>
        (Showing items from warehouse ID: <strong>{selectedWarehouseId || 'None selected'}</strong>)
      </p>

      {items.length === 0 ? (
        <div>No inventory items found.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {items.map((item) => {
            const maxLevel = item.maximumStockLevel || 100;
            const quantityOnHand = item.quantityOnHand || 0;
            const reorderPoint = item.reorderPoint || 0;
            const usagePercent = Math.min((quantityOnHand / maxLevel) * 100, 100);
            const isBelowReorder = quantityOnHand <= reorderPoint;

            const product = productsMap[item.productId] || {};

            return (
              <Card key={item._id}>
                {/* Product Image */}
                {product.images && product.images[0] ? (
                  <ProductImage src={product.images[0]} alt={product.name} />
                ) : (
                  <PlaceholderImage>No Image</PlaceholderImage>
                )}

                {/* Product Name */}
                <h4>{product.name || 'Unnamed Product'}</h4>

                {/* Brand */}
                <p>
                  <strong>Brand:</strong> {product.brand || 'N/A'}
                </p>

                {/* Variant Details */}
                <p>
                  <strong>Variant:</strong> {getVariantDetails(item)}
                </p>

                {/* SKU */}
                <p>
                  <strong>SKU:</strong> {item.sku}
                </p>

                {/* Inventory Details */}
                <p>
                  <strong>On Hand:</strong> {quantityOnHand}
                </p>
                <p>
                  <strong>Reorder Point:</strong> {reorderPoint}
                </p>
                <p>
                  <strong>Max Stock Level:</strong> {maxLevel}
                </p>

                {/* Progress Bar */}
                <ProgressBarContainer>
                  <ProgressBar width={usagePercent} isBelowReorder={isBelowReorder} />
                </ProgressBarContainer>

                {/* Warning Message */}
                {isBelowReorder && (
                  <WarningText>Warning: Below Reorder Level!</WarningText>
                )}

                {/* Additional Information (Optional) */}
                <p>
                  <strong>Status:</strong> {item.status || 'N/A'}
                </p>
                <p>
                  <strong>Condition:</strong> {item.condition || 'N/A'}
                </p>
                <p>
                  <strong>Cost Price:</strong> ${item.costPrice.toFixed(2)}
                </p>
                <p>
                  <strong>Sell Price:</strong> ${item.sellPrice.toFixed(2)}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
