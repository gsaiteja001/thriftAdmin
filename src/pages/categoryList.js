import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';

import { LoginContext } from '../context/loginContext';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  // We store the selected and expanded categories by their `categoryId`, not `_id`.
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);

  const { sellerInfo } = useContext(LoginContext);

  // For creating a new category
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentCategory: null, // We'll store the parent's `categoryId` here
  });



  // In CategoryList.jsx
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/seller-categories/all-categories',
        { params: { sellerId: sellerInfo.sellerId } }
      );
      console.log('Nested categories:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };
  fetchCategories();
}, [sellerInfo]);


  // ===== 2. Expanding/Collapsing subcategories =====
  const toggleExpand = (catId) => {
    if (expandedCategoryIds.includes(catId)) {
      setExpandedCategoryIds(expandedCategoryIds.filter((id) => id !== catId));
    } else {
      setExpandedCategoryIds([...expandedCategoryIds, catId]);
    }
  };

  // ===== 3. Selecting categories via checkbox =====
  const handleCheckboxChange = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  // ===== 4. Merging categories =====
  // ===================== MERGE LOGIC =====================
  const handleMerge = async () => {
    if (selectedCategoryIds.length < 2) {
      alert('Please select at least two categories to merge.');
      return;
    }

    // Prompt for new category name
    const newName = prompt('Enter the name for the merged category:');
    if (!newName) return;

    // Prompt for optional description
    const newDescription = prompt('Enter a description (optional):') || '';

    // (Optional) Ask for a parent name
    const parentOptions = getAllCategoriesFlat(categories);
    let parentCategoryId = null;
    if (parentOptions.length > 0) {
      const parentName = prompt(
        'Enter the parent category name (leave blank for no parent):'
      );
      if (parentName) {
        const parent = parentOptions.find((cat) => cat.name === parentName);
        if (!parent) {
          alert('Parent category not found! Merge aborted.');
          return;
        }
        parentCategoryId = parent.categoryId;
      }
    }

    // Build the payload
    const payload = {
      categoryIds: selectedCategoryIds, // old categories to be merged
      newCategory: {
        sellerId: sellerInfo.sellerId,
        categoryId: 'CAT-MERGE-' + Date.now().toString(36).toUpperCase(),
        name: newName.trim(),
        description: newDescription.trim(),
        parentCategory: parentCategoryId || null,
      },
    };

    try {
      await axios.post('http://localhost:8080/api/seller-categories/merge', payload);

      // Re-fetch categories to refresh UI
      const updatedResp = await axios.get(
        'http://localhost:8080/api/seller-categories/all-categories',
        { params: { sellerId: sellerInfo.sellerId } }
      );
      setCategories(updatedResp.data);

      // Clear selection
      setSelectedCategoryIds([]);

      alert('Categories merged successfully!');
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge categories. Check console for details.');
    }
  };

// ===== 5. Renaming categories =====
const handleRename = async () => {
  // The backend rename endpoint can rename multiple categories at once
  // but if you only want to rename one, you can require exactly one selected ID.
  if (selectedCategoryIds.length === 0) {
    alert('Please select at least one category to rename.');
    return;
  }

  // Prompt for the new name (or build your own UI for it).
  const newName = prompt('Enter the new name for the selected category(ies):');
  if (!newName) return;

  try {
    // The rename endpoint expects a POST body with { categoryIds, newName }.
    // It does NOT care about description, so remove that here if you're using renameCategories.
    await axios.post('http://localhost:8080/api/seller-categories/rename', {
      categoryIds: selectedCategoryIds, // array of catIds
      newName: newName.trim(),
    });

    // After rename, re-fetch all categories to update your state.
    const response = await axios.get('http://localhost:8080/api/seller-categories/all-categories', {
      params: { sellerId: sellerInfo.sellerId },
    });
    setCategories(response.data);

    // Clear your selection & inform the user.
    setSelectedCategoryIds([]);
    alert('Category(ies) renamed successfully!');
  } catch (error) {
    console.error('Rename failed:', error);
    alert('Failed to rename category(ies). Check console for details.');
  }
};


  // ===== 6. Deleting categories =====
  const handleDelete = async () => {
    if (selectedCategoryIds.length === 0) {
      alert('No categories selected.');
      return;
    }

    // For each categoryId, call DELETE
    for (const catId of selectedCategoryIds) {
      try {
        await axios.delete(`http://localhost:8080/api/seller-categories/${catId}`);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    // Remove from local state or just re-fetch
    const updated = removeCategoriesByIds(categories, selectedCategoryIds);
    setCategories(updated);
    setSelectedCategoryIds([]);

    alert(`Deleted categories: ${selectedCategoryIds.join(', ')}`);
  };

  // ===== 7. Create a new category =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParentChange = (e) => {
    const val = e.target.value;
    setNewCategory((prev) => ({
      ...prev,
      parentCategory: val || null, // if blank => null
    }));
  };

  const handleSave = async () => {
    if (!newCategory.name.trim()) {
      alert('Category name is required.');
      return;
    }

    try {
      const body = {
        sellerId: sellerInfo.sellerId,
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        // pass parent's categoryId or null
        parentCategory: newCategory.parentCategory || null,
      };

      const response = await axios.post('http://localhost:8080/api/seller-categories/create', body);
      const created = response.data;

      // Re-fetch or update local
      setCategories((prev) => [...prev, created]); // This might not reflect nesting properly
      // safer to re-fetch so we get the newly built tree
      const updatedResponse = await axios.get('http://localhost:8080/api/seller-categories/all-categories', {
        params: { sellerId: sellerInfo.sellerId },
      });
      setCategories(updatedResponse.data);

      setShowAddForm(false);
      setNewCategory({ name: '', description: '', parentCategory: null });
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Check console for details.');
    }
  };

  // The recursive function in CategoryList.jsx
// -- CategoryList.jsx --

const renderCategoryTree = (categoryList, depth = 0) => {
  return categoryList.map((cat) => {
    const hasChildren = cat.subCategories && cat.subCategories.length > 0;
    const isExpanded = expandedCategoryIds.includes(cat.categoryId);

    return (
      <div key={cat.categoryId} style={{ ...styles.treeItem, marginLeft: depth * 20 }}>
        {/* A single row for this category */}
        <div style={styles.treeRow}>
          {/* Expand/Collapse Arrow */}
          {hasChildren ? (
            <button
              style={styles.expandButton}
              onClick={() => toggleExpand(cat.categoryId)}
            >
              {isExpanded ? '▼' : '►'}
            </button>
          ) : (
            <span style={styles.expandPlaceholder}></span>
          )}

          {/* Checkbox */}
          <input
            type="checkbox"
            style={styles.treeCheckbox}
            checked={selectedCategoryIds.includes(cat.categoryId)}
            onChange={() => handleCheckboxChange(cat.categoryId)}
          />

          {/* Name & Description */}
          <div style={styles.categoryDetails}>
            <span style={styles.categoryName}>{cat.name}</span>
            {cat.description && (
              <span style={styles.categoryDescription}>
                {cat.description}
              </span>
            )}
          </div>
        </div>

        {/* Recursively render nested children if expanded */}
        {hasChildren && isExpanded && renderCategoryTree(cat.subCategories, depth + 1)}
      </div>
    );
  });
};

  // ===== 9. Helper functions =====

  // Recursively find a category by its categoryId in the nested array
  function findCategoryById(categoryList, targetId) {
    for (const cat of categoryList) {
      if (cat.categoryId === targetId) return cat;
      if (cat.children?.length) {
        const found = findCategoryById(cat.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  // Remove categories after delete
  function removeCategoriesByIds(categoryList, idsToRemove) {
    return categoryList
      .filter((cat) => !idsToRemove.includes(cat.categoryId))
      .map((cat) => ({
        ...cat,
        children: cat.children
          ? removeCategoriesByIds(cat.children, idsToRemove)
          : [],
      }));
  }

  // Flatten all categories so we can pick a parent in the "Add Category" form
  function getAllCategoriesFlat(categoryList, flat = []) {
    categoryList.forEach((cat) => {
      flat.push({ categoryId: cat.categoryId, name: cat.name });
      if (cat.children && cat.children.length > 0) {
        getAllCategoriesFlat(cat.children, flat);
      }
    });
    return flat;
  }

  // ===== 10. Render the main component =====
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Manage Your Categories</h1>
        <p style={styles.subtitle}>
          The more specific and clear your <strong>eco-friendly</strong> categories,
          the better your customers can find them.
        </p>
        <button style={styles.addButton} onClick={() => setShowAddForm(true)}>
          + Add New Category
        </button>
      </header>

      {/* Add Category Form (collapsible) */}
      <div
        style={{
          ...styles.addFormContainer,
          maxHeight: showAddForm ? '500px' : '0px',
          opacity: showAddForm ? 1 : 0,
          padding: showAddForm ? '20px' : '0px 20px',
          marginBottom: showAddForm ? '20px' : '0px',
        }}
      >
        {showAddForm && (
          <div style={styles.addForm}>
            <h2 style={styles.formTitle}>Add New Category</h2>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Category Name</label>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleInputChange}
                style={styles.formInput}
                placeholder="Enter category name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                name="description"
                value={newCategory.description}
                onChange={handleInputChange}
                style={styles.formTextarea}
                placeholder="Enter category description"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Parent Category</label>

                <select
                  name="parentCategory"
                  value={newCategory.parentCategory || ''}
                  onChange={handleParentChange}
                  style={styles.formSelect}
                >
                  <option value="">None (Top-Level)</option>
                  {getAllCategoriesFlat(categories).map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>

            </div>

            <div style={styles.formActions}>
              <button style={styles.saveButton} onClick={handleSave}>
                Save
              </button>
              <button style={styles.cancelButton} onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions (Merge, Rename, Delete) */}
      {selectedCategoryIds.length > 0 && (
        <div style={styles.bulkActions}>
          <button style={styles.actionButton} onClick={handleMerge}>
            Merge
          </button>
          <button style={styles.actionButton} onClick={handleRename}>
            Rename
          </button>
          <button
            style={{ ...styles.actionButton, backgroundColor: '#E14D2A' }}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      )}

      {/* Category Tree */}
      <div style={styles.categoryTree}>
  {categories.length > 0 ? (
          <div>
          {renderCategoryTree(categories, 0)}
        </div>
  ) : (
    <div style={styles.noCategories}>No categories found.</div>
  )}
</div>

    </div>
  );
};

// ===== Inline Styles (unchanged) =====
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf9fc',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  header: {
    background: 'linear-gradient(45deg, #8B26C2, #D873F5)',
    color: '#fff',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
  },
  subtitle: {
    marginTop: '8px',
    fontSize: '1rem',
    lineHeight: 1.4,
  },
  addButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: '#fff',
    color: '#8B26C2',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s, color 0.3s',
  },
  bulkActions: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '10px 20px',
    marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    backgroundColor: '#36A2EB',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  treeItem: {
    marginBottom: '8px',
  },
  treeRow: {
    display: 'flex',
    alignItems: 'flex-start', // so the checkbox & arrow line up at the top
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.3s',
  },
  expandButton: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    marginRight: '6px',
    fontSize: '1rem',
    color: '#666',
  },
  // A placeholder to keep alignment if there's no arrow
  expandPlaceholder: {
    display: 'inline-block',
    width: '1em',
    marginRight: '6px',
  },
  treeCheckbox: {
    marginRight: '10px',
    marginTop: '2px',
    cursor: 'pointer',
  },
  categoryDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  categoryName: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '3px',
    color: '#333',
  },
  categoryDescription: {
    fontSize: '0.85rem',
    fontStyle: 'italic',
    color: '#666',
    lineHeight: 1.3,
  },
  addFormContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    transition: 'max-height 0.5s ease, opacity 0.5s ease, padding 0.5s ease, margin-bottom 0.5s ease',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  formTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.5rem',
    color: '#333',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  formInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  formTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    resize: 'vertical',
    minHeight: '80px',
  },
  formSelect: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    backgroundColor: '#fff',
    appearance: 'none',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  saveButton: {
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
};

export default CategoryList;
