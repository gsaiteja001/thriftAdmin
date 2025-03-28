import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
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

  const fetchItemsByVendor = async (vendorId) => {
    try {
      const response = await axios.get(`https://thriftstorebackend.onrender.com/api/vendor/${vendorId}/items`);
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
      const response = await axios.delete(`https://thriftstorebackend.onrender.com/api/item/${itemId}`);
      console.log('Item deleted successfully:', response.data);
      fetchItemsByVendor();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleItemSave = async () => {
    const newItem = { ...editItemData, imageURL: uploadedImages.join(',') }; // Handle multiple image URLs

    try {
      const response = await axios.put(`https://thriftstorebackend.onrender.com/api/item/${editItemData.item_id}`, newItem);
      console.log('Item updated successfully:', response.data);
      fetchItemsByVendor();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleItemAdd = async () => {
    const newItem = { ...editItemData, imageURL: uploadedImages.join(','), vendor_id: vendorId };

    try {
      const response = await axios.post('https://thriftstorebackend.onrender.com/api/item', newItem);
      console.log('Item added successfully:', response.data);
      fetchItemsByVendor();
      setShowUploadContainer(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };


  const handleAddItemClick = () => {
    setEditItemData({
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

  const handleImageUpload = async (files) => {
    // Ensure files is an array (it might be an array-like object)
    const filesArray = Array.isArray(files) ? files : [files]; // Handle cases where only one file is passed
  
    const formData = new FormData();
  
    // Loop through each file and append it to the FormData object
    filesArray.forEach(file => {
      formData.append('image', file); 
    });
  
    try {
      // Sending the image file using the POST method with multipart/form-data
      const response = await axios.post(
        'https://api.imgbb.com/1/upload?expiration=600&key=4cd9c9ee9a555c27315262a6a7d7a8b2',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Ensure proper content type
          },
        }
      );
  
      // If the response is successful, get the image URL and add to the list of uploaded images
      const imageUrl = response.data.data.url;
      setUploadedImages((prevImages) => [...prevImages, imageUrl]); // Add the uploaded image URL to the preview container
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
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
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

          <ProductListContainer>
            {paginatedItems().map((item) => (
              <ProductCard key={item.item_id}>
                <ProductInfo>
                  <ProductImg src={item.imageURL || ''} alt={item.name} />
                  <ProductTitle>{item.name}</ProductTitle>
                  <ul>
                    <ListItem>Brand: {item.brand}</ListItem>
                    <ListItem>Price: ₹ {item.selling_price}</ListItem>
                    <ListItem>Stock: {item.stock_quantity}</ListItem>
                  </ul>
                </ProductInfo>
                <ButtonGroup>
                  <ViewButton onClick={() => handleViewItem(item)}>View</ViewButton>
                  <EditButton onClick={() => handleItemUpdate(item)}>Edit</EditButton>
                  <DeleteButton onClick={() => handleItemDelete(item.item_id)}>Delete</DeleteButton>
                </ButtonGroup>
              </ProductCard>
            ))}
          </ProductListContainer>

          <PaginateContainer>
            <UpdatedReactPaginate
              previousLabel={'Previous'}
              nextLabel={'Next'}
              
              pageCount={Math.ceil(filteredItems.length / itemsPerPage)}
              onPageChange={handlePageClick}
              containerClassName={'pagination-container'}
              activeClassName={'active'}
              pageClassName={'pagination-item'}
              previousClassName={'previous-button'}
              nextClassName={'next-button'}
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
        onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
      />
    </InputRow>

    <InputRow>
      <Label>Brand:</Label>
      <Input
        type="text"
        value={editItemData.brand}
        onChange={(e) => setEditItemData({ ...editItemData, brand: e.target.value })}
      />
    </InputRow>

    <InputRow>
      <Label>Price:</Label>
      <Input
        type="number"
        value={editItemData.selling_price}
        onChange={(e) => setEditItemData({ ...editItemData, selling_price: e.target.value })}
      />
    </InputRow>

    <InputRow>
      <Label>Description:</Label>
      <Input
        type="text"
        value={editItemData.description}
        onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
      />
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
            <RemoveImageButton onClick={() => removeImage(index)}>Remove</RemoveImageButton>
          </ImagePreview>
        ))}
      </PreviewContainer>
      <PrimaryButton onClick={handleImageUpload}>
        Upload Image
      </PrimaryButton>
    </InputRow>
    
    <ButtonsRow>
      <PrimaryButton onClick={showUploadContainer ? handleItemAdd : handleItemSave}>
        {showUploadContainer ? 'Add Item' : 'Save Changes'}
      </PrimaryButton>
      <PrimaryButton onClick={() => showUploadContainer ? setShowUploadContainer(false) : setShowEditModal(false)}>
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


const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const SearchInput = styled.input`
  padding: 10px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const ProductListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;


const Dropzone = styled.div`
  border: 2px dashed #007bff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
`;

const PreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  width: 100px;
  height: 100px;
  overflow: hidden;
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: red;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 5px;
  font-size: 12px;
`;


const ProductCard = styled.div`
  width: 300px;
  padding: 20px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`;

const ProductInfo = styled.div`
  margin-bottom: 20px;
`;

const ProductImg = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
`;

const ProductTitle = styled.h3`
  font-size: 1.2rem;
  margin: 10px 0;
`;

const ListItem = styled.li`
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ViewButton = styled.button`
  padding: 5px 10px;
  background-color: #28a745;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
`;

const EditButton = styled.button`
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
`;

const DeleteButton = styled.button`
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
`;

const PaginateContainer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PaginationButton = styled.button`
  padding: 10px;
  margin: 0 5px;
  background-color: #f0f0f0;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;

  &:hover {
    background-color: #007bff;
    color: white;
  }

  &.active {
    background-color: #007bff;
    color: white;
  }

  &:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;

const UpdatedReactPaginate = styled(ReactPaginate)`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;


const Modal = styled.div`
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
  padding: 20px;
  background-color: white;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  z-index: 1000;
`;

const ModalTitle = styled.h2`
  margin-bottom: 20px;
`;

const InputRow = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PrimaryButton = styled.button`
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #218838;
  }
`;

