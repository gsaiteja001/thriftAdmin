import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { thStyle, tdStyle } from './styledComponents';
import styled, { keyframes } from 'styled-components';
import { useDropzone } from 'react-dropzone';

import { LoginContext } from '../../context/loginContext';

/* ------------------------------------------------------------------
   STYLES FOR TABLE + SLIDE PANEL + MODALS
------------------------------------------------------------------ */
const slideDown = keyframes`
  from { max-height: 0; opacity: 0; }
  to   { max-height: 200px; opacity: 1; }
`;

const AddProductButton = styled.button`
  background: #007bff;
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  border-radius: 4px;
`;

const SlideUpPanel = styled.div`
  background-color: #f8f8f8;
  margin-bottom: 1rem;
  overflow: hidden;
  animation: ${slideDown} 0.3s ease-out forwards;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 1rem;
`;

const SlidePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CloseIcon = styled.span`
  font-size: 1.2rem;
  cursor: pointer;
`;

const ProductOptionButton = styled.button`
  background: #28a745;
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  cursor: pointer;
  border-radius: 4px;

  &:last-child {
    margin-right: 0;
  }
`;

/* Existing Product Modal */
const ModalBackdrop = styled.div`
  position: fixed;
  z-index: 999; 
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.5);
`;

const ModalContainer = styled.div`
  position: fixed;
  z-index: 1000;
  background: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
`;

const CloseModalButton = styled.button`
  margin-top: 1.5rem;
  background: #dc3545;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  float: right;
`;

/* -------------- Updated styling for Existing Products -------------- */
const ExistingProductsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

/* Single product card */
const ProductCard = styled.div`
  flex: 0 0 calc(25% - 1rem);
  background: #fff;
  border: 2px solid ${(props) => (props.selected ? '#007bff' : '#ccc')};
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  max-height: 120px;
  background-color: #eee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-weight: 600;
  font-size: 0.9rem;
`;

const ProductTitle = styled.h4`
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #333;
  flex: 1;
`;

const ProductBrand = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
`;

const VariantContainer = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ccc;
  background-color: #f9f9f9;
`;

const VariantItem = styled.label`
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;

  input {
    margin-right: 0.4rem;
  }
`;

const AddToStoreButton = styled.button`
  background-color: #28a745;
  color: #fff;
  border: none;
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  float: right;
`;

/* ------------------------------------------------------------------
   NEW PRODUCT MODAL (EXACTLY LIKE YOUR SNIPPET)
   We'll inline all the styling from your snippet.
------------------------------------------------------------------ */
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 1000;
`;

const NewProductModal = styled.div`
  position: fixed;
  top: 10%;
  left: 5%;
  width: 90%;
  height: 80%;
  overflow-y: auto;
  background-color: #fff;
  z-index: 1100;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.2);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  flex: 0 0 150px;
  font-weight: 500;
  color: #333;
`;

const Select = styled.select`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  &:focus {
    outline: none;
    border-color: #673ab7;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  &:focus {
    outline: none;
    border-color: #673ab7;
  }
`;

const Checkbox = styled.input`
  margin-left: 0;
`;

const SectionTitle = styled.h4`
  margin-top: 30px;
  margin-bottom: 10px;
  color: #4e4e4e;
  border-left: 3px solid #673ab7;
  padding-left: 8px;
`;

const SectionSubTitle = styled.h5`
  margin: 20px 0 5px;
  color: #555;
`;

const VariantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const RemoveVariantButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 1rem;
`;

const AddVariantButton = styled.button`
  background-color: #17a2b8;
  color: #fff;
  border: none;
  border-radius: 30px;
  padding: 8px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background-color: #138496;
  }
`;

const SmallButton = styled.button`
  background-color: #17a2b8;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #138496;
  }
`;

const DangerButton = styled.button`
  background-color: #dc3545;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c82333;
  }
`;

const KeywordList = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const KeywordItem = styled.div`
  background-color: #e7e7e7;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const RemoveKeywordButton = styled.button`
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 2px 5px;
`;

const DropZone = styled.div`
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  &:hover {
    background-color: #f2f2f2;
  }
`;

const ImagePreviewContainer = styled.div`
  margin-bottom: 20px;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
`;

const PreviewImg = styled.img`
  width: 50px;
  height: 50px;
  margin-right: 10px;
  object-fit: cover;
  border-radius: 4px;
`;

const RemoveImageButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 0.85rem;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
`;

const PrimaryButton = styled.button`
  padding: 8px 14px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  &:hover {
    background: #218838;
  }
`;

const SuccessMark = styled.span`
  margin-left: 5px;
  color: green;
`;

const UrlContainer = styled.div`
  background-color: #fafafa;
  padding: 10px;
  margin-top: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const UrlItem = styled.p`
  margin: 5px 0;
  font-size: 0.85rem;
  color: #555;
`;

const CloseNewProductModalButton = styled.button`
  display: block;
  margin: 20px auto;
  padding: 10px 18px;
  background-color: #ff4757;
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #e84118;
  }
`;

/* SubCategorySelect (same as your snippet) */
const SubCategorySelect = ({
  categoryId,
  categories,
  subCategory,
  setSubCategory,
}) => {
  const selectedCategoryObj = categories.find((c) => c.categoryId === categoryId);
  if (!selectedCategoryObj) return null;
  const subCats = selectedCategoryObj.subCategories || [];

  if (subCats.length === 0) {
    return null;
  }

  return (
    <Row>
      <Label>Sub-Category:</Label>
      <Select
        value={subCategory}
        onChange={(e) => setSubCategory(e.target.value)}
      >
        <option value="">Select Sub-Category</option>
        {subCats.map((child) => (
          <option key={child._id} value={child.categoryId}>
            {child.name || 'NoName'}
          </option>
        ))}
      </Select>
    </Row>
  );
};

/* ------------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------------ */

const API_BASE_URL = 'http://localhost:8080/api';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150x100?text=No+Image';

export default function ItemsListTab({ selectedWarehouseId }) {
  /* -------------------- STATES for inventory items -------------------- */
  const [items, setItems] = useState([]);

  const { login, sellerInfo } = useContext(LoginContext); 

  /* -------------------- Slide Panel & Modal States -------------------- */
  const [showAddProductOptions, setShowAddProductOptions] = useState(false);
  const [showExistingProductModal, setShowExistingProductModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  /* -------------------- Existing Products Selection -------------------- */
  const [existingProducts, setExistingProducts] = useState([]);
  const [selectedProductVariants, setSelectedProductVariants] = useState({});

  /* -------------------- EXACT STATES & LOGIC from your New Product Snippet -------------------- */
  const [categories, setCategories] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [warranty, setWarranty] = useState('');
  const [brand, setBrand] = useState('');
  const [discount, setDiscount] = useState(0);
  const [price, setPrice] = useState(0);
  const [variants, setVariants] = useState([
    {
      variantId: '',
      variantType: { size: '', color: '', weight: '' },
      variantUnit: '',
    },
  ]);

  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');

  const [materialsInvolved, setMaterialsInvolved] = useState([]);
  const [materialInput, setMaterialInput] = useState('');

  // Environmental parameters
  const [alternateCarbonFootprint, setAlternateCarbonFootprint] = useState(0);
  const [alternateEnergyConsumption, setAlternateEnergyConsumption] = useState(0);
  const [alternateTreesConsumption, setAlternateTreesConsumption] = useState(0);
  const [carbonFootprint, setCarbonFootprint] = useState(0);
  const [energyConsumption, setEnergyConsumption] = useState(0);
  const [treesConsumption, setTreesConsumption] = useState(0);
  const [recycledContent, setRecycledContent] = useState(0);
  const [sustainableSourcing, setSustainableSourcing] = useState(false);
  const [recyclable, setRecyclable] = useState(false);
  const [carbonNeutral, setCarbonNeutral] = useState(false);

  // Current stock
  const [currentStock, setCurrentStock] = useState(0);

  // Images
  const [oldImageURLs, setOldImageURLs] = useState([]);
  const [newImageURLs, setNewImageURLs] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);

  // Product creation or editing
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productUploadSuccess, setProductUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [productsMap, setProductsMap] = useState({});

  /* -------------------- Effects -------------------- */
  // 1) Fetch warehouse items
  // 1) Fetch warehouse items
useEffect(() => {
  if (!selectedWarehouseId) return;

  const fetchItems = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/inventory/Items`, {
        params: { warehouseId: selectedWarehouseId },
      });
      // Set items to the `data` array from the response
      const fetchedItems = res.data.data || [];
      setItems(fetchedItems);
    } catch (error) {
      console.error('Failed to fetch inventory items for monitoring', error);
    }
  };

  fetchItems();
}, [selectedWarehouseId]);


// 2) Once we have items, fetch product data for each unique productId
useEffect(() => {
  if (items.length === 0) return;
// Inside ItemsListTab.jsx

const fetchProductData = async () => {
  try {
    // Gather unique productIds to avoid redundant requests
    const uniqueProductIds = [...new Set(items.map((i) => i.productId))];

    // Create an array of GET requests for each unique productId
    const requests = uniqueProductIds.map((pid) =>
      axios.get(`http://localhost:8080/api/products/${pid}`).then(
        (response) => ({
          success: true,
          productId: pid,
          data: response.data,
        }),
        (error) => ({
          success: false,
          productId: pid,
          error: error.response?.data?.message || error.message,
        })
      )
    );

    // Execute all requests in parallel
    const responses = await Promise.all(requests);

    // Build a map/dictionary: productId => productDoc
    const productMap = {};

    responses.forEach((resp) => {
      if (resp.success && resp.data.productId) {
        productMap[resp.data.productId] = resp.data;
      } else {
        console.warn(`Failed to fetch productId ${resp.productId}: ${resp.error}`);
        // Optionally, set a default value or handle missing products as needed
        productMap[resp.productId] = null; // or {} or some placeholder
      }
    });

    setProductsMap(productMap);
  } catch (error) {
    console.error('Error fetching product data:', error);
  }
};


  fetchProductData();
}, [items]);

  

  // 2) Fetch categories for your new-product form
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/seller-categories/all-categories`);
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.error('Categories data is not an array:', res.data);
        }
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };
    getCategories();
  }, []);

  const categoryDict = useMemo(() => {
    const dict = {};
    categories.forEach((cat) => {
      dict[cat.categoryId] = cat;
    });
    return dict;
  }, [categories]);

  /* -------------------- Slide Panel Logic -------------------- */
  const toggleAddProductOptions = () => {
    setShowAddProductOptions((prev) => !prev);
  };

  /* -------------------- Existing Product Modal Logic -------------------- */
  const openExistingProductsModal = () => {
    setShowExistingProductModal(true);
    // fetch existing products if needed
    fetchExistingProducts();
  };

  const closeExistingProductModal = () => {
    setShowExistingProductModal(false);
  };

  const fetchExistingProducts = async () => {
    const sellerId = sellerInfo.sellerId;
    if (!sellerId) return; // If sellerId not set, skip fetch
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/products/productsBySeller/${sellerId}`
      );
      setExistingProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching existing products', error);
      setExistingProducts([]);
    }
  };

  // Toggle product selection
  const handleProductSelect = (productId) => {
    setSelectedProductVariants((prev) => {
      const isSelected = !!prev[productId]?.selected;
      if (isSelected) {
        // unselect => remove
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      } else {
        // select => create entry
        return {
          ...prev,
          [productId]: { selected: true, variants: {} },
        };
      }
    });
  };

  // Toggle variant
  const handleVariantSelect = (productId, variantId) => {
    setSelectedProductVariants((prev) => {
      const productEntry = prev[productId] || { selected: false, variants: {} };
      const variantState = !!productEntry.variants[variantId];
      return {
        ...prev,
        [productId]: {
          ...productEntry,
          variants: {
            ...productEntry.variants,
            [variantId]: !variantState,
          },
        },
      };
    });
  };

  const isVariantSelectionValid = () => {
    for (const productId in selectedProductVariants) {
      if (selectedProductVariants[productId].selected) {
        const variantsObj = selectedProductVariants[productId].variants || {};
        const anyVariantSelected = Object.values(variantsObj).some(Boolean);
        if (!anyVariantSelected) {
          return false;
        }
      }
    }
    return true;
  };

  const handleAddToStore = async () => {
    if (!isVariantSelectionValid()) {
      alert('Please select at least one variant for each chosen product.');
      return;
    }
  
    try {
      // Build an array of new inventory items
      const newInventoryItems = [];
  
      Object.entries(selectedProductVariants).forEach(([productId, productObj]) => {
        if (productObj.selected) {
          // Find the product object in `existingProducts` to get info like `variants[]`, brand, etc.
          const productData = existingProducts.find((p) => p._id === productId);
          if (!productData) return;
  
          // For each selected variant, create an InventoryItem
          Object.entries(productObj.variants).forEach(([variantId, isVariantSelected]) => {
            if (isVariantSelected) {
              // Example: generate an SKU
              const sku = `${productData._id}-${variantId}`;
  
              newInventoryItems.push({
                sellerId: sellerInfo.sellerId,
                warehouseId: selectedWarehouseId,
                productId: productData.productId,      // or productData.productId if you prefer
                variantId: variantId,
                sku,
                quantityOnHand: 0,
                quantityReserved: 0,
                condition: 'New',
                costPrice: 0,
              });
            }
          });
        }
      });
  
      if (newInventoryItems.length === 0) {
        alert('Nothing selected!');
        return;
      }
  
      // POST to your inventory endpoint
      const response = await axios.post(`http://localhost:8080/api/inventory/inventoryItems`, newInventoryItems);
      console.log('Add to store response:', response.data);
      alert('Inventory items added successfully!');
  
      // Close modal, refresh any lists, etc.
      closeExistingProductModal();
      // Optionally, re-fetch warehouse items
      // fetchItems(); // if you have that function handy
    } catch (error) {
      console.error('Error adding items to inventory:', error);
      alert('Failed to add items to inventory');
    }
  };
  
  /* -------------------- New Product Modal Logic -------------------- */
  const openNewProductModal = () => {
    setShowNewProductModal(true);
  };
  const closeNewProductModal = () => {
    setShowNewProductModal(false);
    resetForm();
  };

  // Reset all the form fields
  const resetForm = () => {
    setUploadCategory('');
    setSubCategory('');
    setName('');
    setDescription('');
    setWarranty('');
    setBrand('');
    setDiscount(0);
    setPrice(0);
    setVariants([
      {
        variantId: '',
        variantType: { size: '', color: '', weight: '' },
        variantUnit: '',
      },
    ]);
    setKeywords([]);
    setKeywordInput('');
    setMaterialsInvolved([]);
    setMaterialInput('');
    setAlternateCarbonFootprint(0);
    setAlternateEnergyConsumption(0);
    setAlternateTreesConsumption(0);
    setCarbonFootprint(0);
    setEnergyConsumption(0);
    setTreesConsumption(0);
    setRecycledContent(0);
    setSustainableSourcing(false);
    setRecyclable(false);
    setCarbonNeutral(false);
    setCurrentStock(0);
    setOldImageURLs([]);
    setNewImageURLs([]);
    setProductImages([]);
    setUploadedImages([]);
    setImageUploadSuccess(false);
    setProductUploadSuccess(false);
    setUploadMessage('');
    setSelectedProductId(null);
  };

  // Handle image drops
  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setProductImages(newFiles);
    setUploadedImages(acceptedFiles);
    setImageUploadSuccess(false);
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Remove image from either old or newly dropped
  const removeImage = (index, isOld = false) => {
    if (isOld) {
      setOldImageURLs((prev) => prev.filter((_, i) => i !== index));
    } else {
      setProductImages((prev) => prev.filter((_, i) => i !== index));
      setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Upload images to S3 (or your chosen service)
  const uploadImagesToS3 = async () => {
    if (uploadedImages.length === 0) {
      alert('No images to upload.');
      return;
    }
    try {
      const uploadPromises = uploadedImages.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post(
          'http://localhost:8080/upload_seller_product_image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data?.imageUrl || null;
      });
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(Boolean);
      setNewImageURLs(validUrls);
      setProductImages([]);
      setUploadedImages([]);
      setImageUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  // Final product upload (create or update)
  const handleProductUpload = async () => {
    // Construct the object as in your snippet
    const productData = {
      category: uploadCategory,
      subCategory: subCategory || undefined,
      description,
      warranty,
      name,
      variants: variants.map((v) => ({
        variantId: v.variantId || `${Date.now()}-${Math.random()}`,
        variantType: {
          size: v.variantType.size,
          color: v.variantType.color,
          weight: v.variantType.weight,
        },
        variantUnit: v.variantUnit,
      })),
      discount,
      keywords,
      brand,
      materialsInvolved,
      environmentalParameters: {
        alternateCarbonFootprint,
        alternateEnergyConsumption,
        alternateTreesConsumption,
        carbonFootprint,
        energyConsumption,
        treesConsumption,
      },
      recycledContent,
      sustainableSourcing,
      recyclable,
      carbonNeutral,
      // if currentStock not in your new schema, remove it
      currentStock,
      price,
      images: [...oldImageURLs, ...newImageURLs],
    };

    try {
      if (selectedProductId) {
        // Edit existing
        await axios.put(`${API_BASE_URL}/products/${selectedProductId}`, productData);
        setUploadMessage('Product updated successfully!');
      } else {
        // Create new
        const resp = await axios.post(`${API_BASE_URL}/products`, productData);
        setUploadMessage(resp.data.message || 'Product created successfully!');
      }
      setProductUploadSuccess(true);
      resetForm();
      closeNewProductModal();
    } catch (error) {
      console.error('Error uploading product:', error);
      setUploadMessage('Error uploading product');
    }
  };

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */
  return (
    <div>
      <h2>Items List</h2>
      <p style={{ marginBottom: '1rem' }}>
        (Showing items from warehouse ID: <strong>{selectedWarehouseId || 'None selected'}</strong>)
      </p>

      {/* Add Product Button => Slide Panel */}
      {!showAddProductOptions && (
        <AddProductButton onClick={toggleAddProductOptions}>
          + Add Product
        </AddProductButton>
      )}

      {showAddProductOptions && (
        <SlideUpPanel>
          <SlidePanelHeader>
            <h4>Select an option</h4>
            <CloseIcon onClick={toggleAddProductOptions}>×</CloseIcon>
          </SlidePanelHeader>
          <div>
            <ProductOptionButton
              onClick={() => {
                openExistingProductsModal();
                toggleAddProductOptions();
              }}
            >
              Existing Product
            </ProductOptionButton>
            <ProductOptionButton
              onClick={() => {
                openNewProductModal();
                toggleAddProductOptions();
              }}
            >
              New Product
            </ProductOptionButton>
          </div>
        </SlideUpPanel>
      )}

      {/* The table of items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
  <thead>
    <tr style={{ backgroundColor: '#f2f2f2' }}>
      <th style={thStyle}>Product Name</th>
      <th style={thStyle}>Brand</th>
      <th style={thStyle}>Variant</th>
      <th style={thStyle}>On Hand</th>
      <th style={thStyle}>Reserved</th>
      <th style={thStyle}>Available</th>
      <th style={thStyle}>Reorder Point</th>
      <th style={thStyle}>Reorder Qty</th>
      <th style={thStyle}>Max Stock</th>
      <th style={thStyle}>Cost Price</th>
      <th style={thStyle}>Sell Price</th>
      <th style={thStyle}>Status</th>
    </tr>
  </thead>
  <tbody>
    {items.length === 0 ? (
      <tr>
        <td colSpan={14} style={{ textAlign: 'center', padding: '1rem' }}>
          No items found.
        </td>
      </tr>
    ) : (
      items.map((item) => {
        const product = productsMap[item.productId] || {};
        
        // find the matching variant in product.variants (if present)
        const matchedVariant = (product.variants || []).find(
          (v) => v.variantId === item.variantId
        );

        const variantLabel = matchedVariant
          ? [
              matchedVariant.variantType?.size,
              matchedVariant.variantType?.color,
              matchedVariant.variantType?.weight,
            ]
              .filter(Boolean)
              .join(' / ')
          : item.variantId; // fallback

        return (
          <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={tdStyle}>{product.name || 'N/A'}</td>
            <td style={tdStyle}>{product.brand || 'N/A'}</td>
            <td style={tdStyle}>{variantLabel}</td>
            <td style={tdStyle}>{item.quantityOnHand}</td>
            <td style={tdStyle}>{item.quantityReserved}</td>
            <td style={tdStyle}>{item.quantityAvailable}</td>
            <td style={tdStyle}>{item.reorderPoint}</td>
            <td style={tdStyle}>{item.reorderQuantity}</td>
            <td style={tdStyle}>{item.maximumStockLevel || '-'}</td>
            <td style={tdStyle}>{item.costPrice}</td>
            <td style={tdStyle}>{item.sellPrice}</td>
            <td style={tdStyle}>{item.status}</td>
          </tr>
        );
      })
    )}
  </tbody>
</table>


      {/* Existing Product Modal */}
      {showExistingProductModal && (
        <>
          <ModalBackdrop onClick={closeExistingProductModal} />
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Select Existing Products</ModalTitle>
            <ExistingProductsGrid>
              {existingProducts.map((prod) => {
                const isSelected = !!selectedProductVariants[prod._id]?.selected;
                return (
                  <ProductCard
                    key={prod._id}
                    selected={isSelected}
                    onClick={() => handleProductSelect(prod._id)}
                  >
                    {/* If the product has an image, display it; otherwise show a placeholder */}
                    {prod.images && prod.images[0] ? (
                      <ProductImage src={prod.images[0]} alt={prod.name} />
                    ) : (
                      <PlaceholderImage>No Image</PlaceholderImage>
                    )}

                    <ProductTitle>{prod.name}</ProductTitle>
                    {prod.brand && <ProductBrand>{prod.brand}</ProductBrand>}

                    {/* If selected, show variants panel */}
                    {isSelected && prod.variants && prod.variants.length > 0 && (
                      <VariantContainer>
                        {prod.variants.map((variant) => {
                          const variantChecked =
                            selectedProductVariants[prod._id]?.variants?.[variant.variantId] || false;
                          return (
                            <VariantItem key={variant.variantId}>
                              <input
                                type="checkbox"
                                checked={variantChecked}
                                onClick={(e) => e.stopPropagation()} // prevent card toggle
                                onChange={() => handleVariantSelect(prod._id, variant.variantId)}
                              />
                              {variant.variantId} {/* or variant details (size/color/etc.) */}
                            </VariantItem>
                          );
                        })}
                      </VariantContainer>
                    )}
                  </ProductCard>
                );
              })}
            </ExistingProductsGrid>

            <AddToStoreButton onClick={handleAddToStore}>Add to Store</AddToStoreButton>
            <CloseModalButton onClick={closeExistingProductModal}>Close</CloseModalButton>
          </ModalContainer>
        </>
      )}

      {/* New Product Modal => EXACT snippet you provided */}
      {showNewProductModal && (
        <>
          <Backdrop onClick={closeNewProductModal} />
          <NewProductModal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{selectedProductId ? 'Edit Product' : 'Create Product'}</ModalTitle>

            {/* Category and Sub-Category */}
            <Row>
              <Label>Category:</Label>
              <Select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </Row>

            {uploadCategory && (
              <SubCategorySelect
                categoryId={uploadCategory}
                categories={categories}
                subCategory={subCategory}
                setSubCategory={setSubCategory}
              />
            )}

            {/* Basic Fields */}
            <Row>
              <Label>Name:</Label>
              <Input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Row>
            <Row>
              <Label>Description:</Label>
              <Input
                type="text"
                placeholder="Product Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Row>
            <Row>
              <Label>Warranty:</Label>
              <Input
                type="text"
                placeholder="Warranty Details"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
              />
            </Row>
            <Row>
              <Label>Brand:</Label>
              <Input
                type="text"
                placeholder="Brand Name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Row>
            <Row>
              <Label>Discount (%):</Label>
              <Input
                type="number"
                placeholder="Discount Percentage"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </Row>
            <Row>
              <Label>Price:</Label>
              <Input
                type="number"
                placeholder="Required Price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </Row>

            {/* Variants */}
            <SectionTitle>Variants</SectionTitle>
            {variants.map((variant, index) => (
              <VariantRow key={index}>
                <Input
                  type="text"
                  placeholder="Variant ID"
                  value={variant.variantId}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].variantId = e.target.value;
                    setVariants(newVariants);
                  }}
                />
                <Input
                  type="text"
                  placeholder="Size"
                  value={variant.variantType.size}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].variantType.size = e.target.value;
                    setVariants(newVariants);
                  }}
                />
                <Input
                  type="text"
                  placeholder="Color"
                  value={variant.variantType.color}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].variantType.color = e.target.value;
                    setVariants(newVariants);
                  }}
                />
                <Input
                  type="text"
                  placeholder="Weight"
                  value={variant.variantType.weight}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].variantType.weight = e.target.value;
                    setVariants(newVariants);
                  }}
                />
                <Input
                  type="text"
                  placeholder="Unit (e.g., kg, L)"
                  value={variant.variantUnit}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].variantUnit = e.target.value;
                    setVariants(newVariants);
                  }}
                />
                {variants.length > 1 && (
                  <RemoveVariantButton
                    onClick={() => {
                      const newVariants = variants.filter((_, i) => i !== index);
                      setVariants(newVariants);
                    }}
                  >
                    &times;
                  </RemoveVariantButton>
                )}
              </VariantRow>
            ))}
            <AddVariantButton
              onClick={() =>
                setVariants([
                  ...variants,
                  {
                    variantId: '',
                    variantType: { size: '', color: '', weight: '' },
                    variantUnit: '',
                  },
                ])
              }
            >
              Add Variant
            </AddVariantButton>

            {/* Keywords */}
            <SectionSubTitle>Keywords</SectionSubTitle>
            <Row>
              <Label>Keyword Input:</Label>
              <Input
                type="text"
                placeholder="Add keyword"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <SmallButton
                onClick={() => {
                  const inputKws = keywordInput
                    .split(',')
                    .map((kw) => kw.trim())
                    .filter((kw) => kw);
                  const newKws = [...keywords, ...inputKws].filter(
                    (kw, idx, self) => self.indexOf(kw) === idx
                  );
                  setKeywords(newKws);
                  setKeywordInput('');
                }}
              >
                Add
              </SmallButton>
              <DangerButton onClick={() => setKeywords([])}>Clear</DangerButton>
            </Row>
            {keywords.length > 0 && (
              <KeywordList>
                {keywords.map((kw, i) => (
                  <KeywordItem key={i}>
                    {kw}
                    <RemoveKeywordButton
                      onClick={() => {
                        const updated = keywords.filter((_, idx) => i !== idx);
                        setKeywords(updated);
                      }}
                    >
                      ❌
                    </RemoveKeywordButton>
                  </KeywordItem>
                ))}
              </KeywordList>
            )}

            {/* Materials Involved */}
            <SectionTitle>Materials Involved</SectionTitle>
            <Row>
              <Label>Materials Input:</Label>
              <Input
                type="text"
                placeholder="Add material"
                value={materialInput || ''}
                onChange={(e) => setMaterialInput(e.target.value)}
              />
              <SmallButton
                onClick={() => {
                  const inputMats = materialInput
                    .split(',')
                    .map((m) => m.trim())
                    .filter((m) => m);
                  const newMats = [...materialsInvolved, ...inputMats].filter(
                    (mat, idx, self) => self.indexOf(mat) === idx
                  );
                  setMaterialsInvolved(newMats);
                  setMaterialInput('');
                }}
              >
                Add
              </SmallButton>
              <DangerButton onClick={() => setMaterialsInvolved([])}>
                Clear
              </DangerButton>
            </Row>
            {materialsInvolved.length > 0 && (
              <KeywordList>
                {materialsInvolved.map((mat, i) => (
                  <KeywordItem key={i}>
                    {mat}
                    <RemoveKeywordButton
                      onClick={() => {
                        const updated = materialsInvolved.filter(
                          (_, idx) => i !== idx
                        );
                        setMaterialsInvolved(updated);
                      }}
                    >
                      ❌
                    </RemoveKeywordButton>
                  </KeywordItem>
                ))}
              </KeywordList>
            )}

            {/* Environmental Parameters */}
            <SectionTitle>Environmental Parameters</SectionTitle>
            <Row>
              <Label>Alternate Carbon Footprint:</Label>
              <Input
                type="number"
                value={alternateCarbonFootprint}
                onChange={(e) =>
                  setAlternateCarbonFootprint(Math.abs(Number(e.target.value)))
                }
              />
            </Row>
            <Row>
              <Label>Alternate Energy Consumption:</Label>
              <Input
                type="number"
                value={alternateEnergyConsumption}
                onChange={(e) =>
                  setAlternateEnergyConsumption(Math.abs(Number(e.target.value)))
                }
              />
            </Row>
            <Row>
              <Label>Alternate Trees Consumption:</Label>
              <Input
                type="number"
                value={alternateTreesConsumption}
                onChange={(e) =>
                  setAlternateTreesConsumption(Math.abs(Number(e.target.value)))
                }
              />
            </Row>
            <Row>
              <Label>Carbon Footprint:</Label>
              <Input
                type="number"
                value={carbonFootprint}
                onChange={(e) =>
                  setCarbonFootprint(Math.abs(Number(e.target.value)))
                }
                required
              />
            </Row>
            <Row>
              <Label>Energy Consumption:</Label>
              <Input
                type="number"
                value={energyConsumption}
                onChange={(e) =>
                  setEnergyConsumption(Math.abs(Number(e.target.value)))
                }
                required
              />
            </Row>
            <Row>
              <Label>Trees Consumption:</Label>
              <Input
                type="number"
                value={treesConsumption}
                onChange={(e) =>
                  setTreesConsumption(Math.abs(Number(e.target.value)))
                }
                required
              />
            </Row>

            <Row>
              <Label>Recycled Content (%):</Label>
              <Input
                type="number"
                value={recycledContent}
                onChange={(e) =>
                  setRecycledContent(Math.abs(Number(e.target.value)))
                }
              />
            </Row>
            <Row>
              <Label>Sustainable Sourcing:</Label>
              <Checkbox
                type="checkbox"
                checked={sustainableSourcing}
                onChange={(e) => setSustainableSourcing(e.target.checked)}
              />
            </Row>
            <Row>
              <Label>Recyclable:</Label>
              <Checkbox
                type="checkbox"
                checked={recyclable}
                onChange={(e) => setRecyclable(e.target.checked)}
              />
            </Row>
            <Row>
              <Label>Carbon Neutral:</Label>
              <Checkbox
                type="checkbox"
                checked={carbonNeutral}
                onChange={(e) => setCarbonNeutral(e.target.checked)}
              />
            </Row>

            <Row>
              <Label>Current Stock:</Label>
              <Input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(Math.abs(Number(e.target.value)))}
              />
            </Row>

            {/* Images */}
            <SectionTitle>Images</SectionTitle>
            <Row>
              <Label>Old Images (comma-separated URLs):</Label>
              <Input
                type="text"
                placeholder="Images (comma-separated URLs)"
                value={oldImageURLs.join(', ')}
                onChange={(e) =>
                  setOldImageURLs(e.target.value.split(',').map((url) => url.trim()))
                }
              />
            </Row>
            <DropZone {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag & drop some images here, or click to select files.</p>
            </DropZone>

            <ImagePreviewContainer>
              <h5>Old Images</h5>
              {oldImageURLs.map((url, idx) => (
                <PreviewRow key={idx}>
                  <PreviewImg src={url} alt={`preview ${idx}`} />
                  <RemoveImageButton
                    onClick={() => removeImage(idx, true)}
                    title="Remove Image"
                  >
                    &times;
                  </RemoveImageButton>
                </PreviewRow>
              ))}
            </ImagePreviewContainer>

            <ImagePreviewContainer>
              <h5>New Images</h5>
              {productImages.map((img, idx) => (
                <PreviewRow key={idx}>
                  <PreviewImg src={img.url} alt={`preview ${idx}`} />
                  <RemoveImageButton
                    onClick={() => removeImage(idx)}
                    title="Remove Image"
                  >
                    &times;
                  </RemoveImageButton>
                </PreviewRow>
              ))}
            </ImagePreviewContainer>

            <ButtonsRow>
              <PrimaryButton onClick={uploadImagesToS3}>
                Upload Images {imageUploadSuccess && <SuccessMark>✔</SuccessMark>}
              </PrimaryButton>
              <PrimaryButton onClick={handleProductUpload}>
                {selectedProductId ? 'Update Product' : 'Upload Product'}
              </PrimaryButton>
              {productUploadSuccess && <SuccessMark>✔</SuccessMark>}
            </ButtonsRow>

            {/* Messages */}
            {uploadMessage && <p>{uploadMessage}</p>}

            <UrlContainer>
              <h5>New Image URLs</h5>
              {newImageURLs.map((url, i) => (
                <UrlItem key={i}>{url}</UrlItem>
              ))}
            </UrlContainer>
            <UrlContainer>
              <h5>Final URLs</h5>
              {[...oldImageURLs, ...newImageURLs].map((url, i) => (
                <UrlItem key={i}>{url}</UrlItem>
              ))}
            </UrlContainer>

            <CloseNewProductModalButton onClick={closeNewProductModal}>
              Close
            </CloseNewProductModalButton>
          </NewProductModal>
        </>
      )}
    </div>
  );
}
