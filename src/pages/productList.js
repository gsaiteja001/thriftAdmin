import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { LoginContext } from '../context/loginContext';
import ReactPaginate from 'react-paginate';
import { useDropzone } from 'react-dropzone';

const ProductList = () => {
  const { vendorInfo } = useContext(LoginContext);
  const vendorId = localStorage.getItem('vendorId');

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  const [showUploadContainer, setShowUploadContainer] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [editItemData, setEditItemData] = useState({
    categoryId: '',  
    name: '',
    brand: '',
    size: '',
    color: '',
    item_condition: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    imageURL: '',
    description: '',
    review: 0,
  });

  const [uploadedImages, setUploadedImages] = useState([]); // For handling uploaded images

  const [categories, setCategories] = useState([]);

  const fetchItemsByVendor = async (vendorId) => {
    try {
      const response = await axios.get(`https://thriftstorebackend-8xii.onrender.com/api/vendor/${vendorId}/items`);
      if (Array.isArray(response.data)) {
        setItems(response.data);
        setFilteredItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching items by vendor:', error);
    }
  };

  useEffect(() => {
    const vendorId = localStorage.getItem('vendorId');
    if (vendorId) {
      fetchItemsByVendor(vendorId);
    }
  }, [vendorId, currentPage]);


  const fetchCategories = async () => {
    try {
      const response = await axios.get(`https://thriftstorebackend-8xii.onrender.com/api/vendor-categories/categories/vendor/${vendorId}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  useEffect(() => {
    if (vendorId) {
      fetchCategories();
    }
  }, [vendorId]);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleViewItem = (item) => {
    setViewItem(item);
    setShowViewModal(true);
  };

  const handleItemUpdate = (item) => {
    setEditItemData(item);
    setUploadedImages(item.imageURL ? [item.imageURL] : []); // Pre-fill with existing images if editing
    setShowEditModal(true);
  };

  const handleItemDelete = async (itemId) => {
    try {
      await axios.delete(`https://thriftstorebackend-8xii.onrender.com/api/item/deleteitem/${itemId}`);
      const vendorId = localStorage.getItem('vendorId');
      fetchItemsByVendor(vendorId);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleItemSave = async () => {
    const newItem = { ...editItemData, imageURL: uploadedImages.join(',') };
    try {
      await axios.put(`https://thriftstorebackend-8xii.onrender.com/api/item/updateitem/${editItemData.item_id}`, newItem);
      const vendorId = localStorage.getItem('vendorId');
      fetchItemsByVendor(vendorId);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };
  
  const handleItemAdd = async () => {
    const newItem = { ...editItemData, imageURL: uploadedImages.join(','), vendor_id: vendorId };
    try {
      await axios.post('https://thriftstorebackend-8xii.onrender.com/api/item/additem', newItem);
      const vendorId = localStorage.getItem('vendorId');
      fetchItemsByVendor(vendorId);
      setShowUploadContainer(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };
  
  const handleAddItemClick = () => {
    setEditItemData({
      categoryId: '', // reset the category
      name: '',
      brand: '',
      size: '',
      color: '',
      item_condition: '',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      imageURL: '',
      description: '',
      review: 0,
    });
    setViewItem(null);
    setUploadedImages([]);
    setShowUploadContainer(true);
  };
  

  // Image Upload using FormData with imgbb API
  const handleImageUpload = async (files) => {
    const filesArray = Array.isArray(files) ? files : [files];
    const formData = new FormData();
    filesArray.forEach((file) => {
      formData.append('image', file);
    });
    try {
      const response = await axios.post(
        'https://api.imgbb.com/1/upload?expiration=600&key=4cd9c9ee9a555c27315262a6a7d7a8b2',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const imageUrl = response.data.data.url;
      setUploadedImages((prevImages) => [...prevImages, imageUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleImageUpload(acceptedFiles);
    },
  });

  const removeImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const paginatedItems = () => {
    const offset = currentPage * itemsPerPage;
    return filteredItems.slice(offset, offset + itemsPerPage);
  };

  return (
    <Container>
      <Main>
        <ContentWrapper>
          <SearchInput
            type="text"
            placeholder="Search items..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FiltersContainer>
            <AddButton onClick={handleAddItemClick}>Add Item</AddButton>
          </FiltersContainer>

          {/* Products rendered in table-like rows */}
          <TableContainer>
            <TableHeader>
              <HeaderCell>Image</HeaderCell>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Price</HeaderCell>
              <HeaderCell>Stock</HeaderCell>
              <HeaderCell>Actions</HeaderCell>
            </TableHeader>
            {paginatedItems().map((item) => (
              <ProductRow key={item.item_id}>
                <ImageCell>
                  <ProductImg src={item.imageURL || ''} alt={item.name} />
                </ImageCell>
                <TextCell>{item.name}</TextCell>
                <TextCell>$ {item.selling_price}</TextCell>
                <TextCell>{item.stock_quantity}</TextCell>
                <ActionsCell>
                  <ButtonGroupVertical>
                    <ViewButton onClick={() => handleViewItem(item)}>
                      View
                    </ViewButton>
                    <EditButton onClick={() => handleItemUpdate(item)}>
                      Edit
                    </EditButton>
                    <DeleteButton onClick={() => handleItemDelete(item.item_id)}>
                      Delete
                    </DeleteButton>
                  </ButtonGroupVertical>
                </ActionsCell>
              </ProductRow>
            ))}
          </TableContainer>

          <PaginateContainer>
            <UpdatedReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              pageCount={Math.ceil(filteredItems.length / itemsPerPage)}
              onPageChange={handlePageClick}
              containerClassName="pagination-container"
              activeClassName="active"
              pageClassName="pagination-item"
              previousClassName="previous-button"
              nextClassName="next-button"
            />
          </PaginateContainer>
        </ContentWrapper>
      </Main>

      {/* Add/Edit Item Modal */}
      {(showUploadContainer || showEditModal) && (
        <Modal onClick={(e) => e.stopPropagation()}>
          <ModalTitle>{showUploadContainer ? 'Add Item' : 'Edit Item'}</ModalTitle>
          <InputRow>
            <Label>Name:</Label>
            <Input
              type="text"
              value={editItemData.name}
              onChange={(e) =>
                setEditItemData({ ...editItemData, name: e.target.value })
              }
            />
          </InputRow>
          <InputRow>
            <Label>Brand:</Label>
            <Input
              type="text"
              value={editItemData.brand}
              onChange={(e) =>
                setEditItemData({ ...editItemData, brand: e.target.value })
              }
            />
          </InputRow>
          <InputRow>
            <Label>Price:</Label>
            <Input
              type="number"
              value={editItemData.selling_price}
              onChange={(e) =>
                setEditItemData({ ...editItemData, selling_price: e.target.value })
              }
            />
          </InputRow>
          <InputRow>
            <Label>Description:</Label>
            <Input
              type="text"
              value={editItemData.description}
              onChange={(e) =>
                setEditItemData({ ...editItemData, description: e.target.value })
              }
            />
          </InputRow>
          <InputRow>
            <Label>Category:</Label>
            <Select 
              value={editItemData.categoryId} 
              onChange={(e) => setEditItemData({ ...editItemData, categoryId: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                // Use category.categoryId for the value
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </Select>
          </InputRow>
          <InputRow>
            <Label>Images:</Label>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Dropzone>
                <p>Drag & Drop your images here, or click to select files.</p>
              </Dropzone>
            </div>
            <PreviewContainer>
              {uploadedImages.map((image, index) => (
                <ImagePreview key={index}>
                  <PreviewImg src={image} alt="preview" />
                  <RemoveImageButton onClick={() => removeImage(index)}>
                    Remove
                  </RemoveImageButton>
                </ImagePreview>
              ))}
            </PreviewContainer>
          </InputRow>
          <ButtonsRow>
            <PrimaryButton onClick={showUploadContainer ? handleItemAdd : handleItemSave}>
              {showUploadContainer ? 'Add Item' : 'Save Changes'}
            </PrimaryButton>
            <PrimaryButton
              onClick={() =>
                showUploadContainer ? setShowUploadContainer(false) : setShowEditModal(false)
              }
            >
              Cancel
            </PrimaryButton>
          </ButtonsRow>
        </Modal>
      )}

      {/* View Item Modal */}
      {showViewModal && (
        <Modal onClick={(e) => e.stopPropagation()}>
          <ModalTitle>View Item</ModalTitle>
          <ul>
            <ListItem>Name: {viewItem.name}</ListItem>
            <ListItem>Brand: {viewItem.brand}</ListItem>
            <ListItem>Price: ₹ {viewItem.selling_price}</ListItem>
            <ListItem>Description: {viewItem.description}</ListItem>
            <ListItem>Stock: {viewItem.stock_quantity}</ListItem>
          </ul>
          <PrimaryButton onClick={() => setShowViewModal(false)}>Close</PrimaryButton>
        </Modal>
      )}
    </Container>
  );
};

export default ProductList;

/* ------------------ Styled Components ------------------ */

const Container = styled.div`
  padding: 30px;
  background: #f8f9fa;
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 30px;
  &:focus {
    outline: none;
    border-color: #80bdff;
  }
`;

const Main = styled.main`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  background: #fff;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
`;

const SearchInput = styled.input`
  padding: 12px 15px;
  width: 100%;
  border-radius: 30px;
  border: 1px solid #ced4da;
  margin-bottom: 20px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #80bdff;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 25px;
`;

const AddButton = styled.button`
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: #fff;
  padding: 12px 25px;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.02);
  }
`;

/* Table-like layout */
const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TableHeader = styled.div`
  display: flex;
  padding: 15px 20px;
  background-color: #e9ecef;
  font-weight: bold;
  border-radius: 5px;
  margin-bottom: 10px;
`;

const HeaderCell = styled.div`
  flex: 1;
  text-align: center;
`;

const ProductRow = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.3s;
  &:hover {
    background-color: #f1f3f5;
  }
`;

const ImageCell = styled.div`
  flex: 0 0 80px;
  text-align: center;
`;

const TextCell = styled.div`
  flex: 1;
  text-align: center;
  font-size: 1rem;
`;

const ActionsCell = styled.div`
  flex: 0 0 120px;
  text-align: center;
`;

const ButtonGroupVertical = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProductImg = styled.img`
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ced4da;
`;

/* Pagination Styling */
const PaginateContainer = styled.div`
  margin-top: 30px;
  display: flex;
  justify-content: center;
`;

const UpdatedReactPaginate = styled(ReactPaginate)`
  li {
    list-style: none;
    display: inline-block;
    margin: 0 5px;
    a {
      padding: 10px 15px;
      border-radius: 5px;
      border: 1px solid #ced4da;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #495057;
      text-decoration: none;
    }
    &.active a {
      background-color: #007bff;
      color: #fff;
      border-color: #007bff;
    }
    a:hover {
      background-color: #007bff;
      color: #fff;
    }
  }
`;

/* Modal and Form Styling */
const Modal = styled.div`
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  z-index: 1100;
`;

const ModalTitle = styled.h2`
  margin-bottom: 25px;
  text-align: center;
  color: #343a40;
`;

const InputRow = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  margin-bottom: 8px;
  color: #495057;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 30px;
  &:focus {
    outline: none;
    border-color: #80bdff;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 15px;
`;

const PrimaryButton = styled.button`
  padding: 10px 25px;
  background: linear-gradient(45deg, #28a745, #218838);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.03);
  }
`;

/* Dropzone and Image Preview */
const Dropzone = styled.div`
  border: 2px dashed #007bff;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  color: #495057;
  cursor: pointer;
  margin-bottom: 15px;
  transition: background 0.3s ease;
  &:hover {
    background: #e9ecef;
  }
`;

const PreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ced4da;
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(220,53,69, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* List Styling */
const ListItem = styled.li`
  font-size: 0.95rem;
  color: #495057;
  margin-bottom: 5px;
`;

/* Action Buttons Styling */
const ViewButton = styled.button`
  padding: 8px 15px;
  background: linear-gradient(45deg, #28a745, #218838);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #218838;
  }
`;

const EditButton = styled.button`
  padding: 8px 15px;
  background: linear-gradient(45deg, #007bff, #0069d9);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #0069d9;
  }
`;

const DeleteButton = styled.button`
  padding: 8px 15px;
  background: linear-gradient(45deg, #dc3545, #c82333);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #c82333;
  }
`;
