// src/components/InventoryPage/WarehouseDetailsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { toast } from 'react-toastify'; // If using react-toastify for notifications

const API_BASE_URL = 'http://localhost:8080';

// Styled Components
const DetailsContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
`;

const DetailField = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const TextArea = styled.textarea`
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  
  &:disabled {
    background-color: #cccccc;
  }
`;

const ErrorMessage = styled.p`
  color: red;
`;

const SuccessMessage = styled.p`
  color: green;
`;

export default function WarehouseDetailsTab({ sellerId, warehouseId, refreshWarehouses }) {
  const [warehouse, setWarehouse] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch warehouse details when warehouseId changes
  useEffect(() => {
    if (!warehouseId) return;

    const fetchWarehouseDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/warehouses/${sellerId}/${warehouseId}`);
        setWarehouse(res.data.data);
        setFormData(flattenWarehouseData(res.data.data));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch warehouse details', err);
        setError('Failed to fetch warehouse details.');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseDetails();
  }, [sellerId, warehouseId]);

  // Helper function to flatten nested warehouse data for the form
  const flattenWarehouseData = (data) => {
    return {
      warehouseName: data.warehouseName || '',
      tagline: data.tagline || '',
      logoUrl: data.logoUrl || '',
      faviconUrl: data.faviconUrl || '',
      aboutUs: data.aboutUs || '',
      supportEmail: data.supportEmail || '',
      phoneNumber: data.phoneNumber || '',
      physicalAddressAddressLine1: data.physicalAddress?.addressLine1 || '',
      physicalAddressAddressLine2: data.physicalAddress?.addressLine2 || '',
      physicalAddressCity: data.physicalAddress?.city || '',
      physicalAddressState: data.physicalAddress?.state || '',
      physicalAddressPostalCode: data.physicalAddress?.postalCode || '',
      physicalAddressCountry: data.physicalAddress?.country || '',
      socialLinksFacebook: data.socialLinks?.facebook || '',
      socialLinksTwitter: data.socialLinks?.twitter || '',
      socialLinksInstagram: data.socialLinks?.instagram || '',
      socialLinksYoutube: data.socialLinks?.youtube || '',
      socialLinksLinkedin: data.socialLinks?.linkedin || '',
      ecoStatement: data.ecoStatement || '',
      storePoliciesTerms: data.storePolicies?.terms || '',
      storePoliciesPrivacy: data.storePolicies?.privacy || '',
      storePoliciesReturns: data.storePolicies?.returns || '',
      safetyMeasures: data.safetyMeasures || '',
      area: data.area || '',
      // Add other fields as necessary
    };
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Prepare the data to match backend expectations
    const updatedData = {
      warehouseName: formData.warehouseName,
      tagline: formData.tagline,
      logoUrl: formData.logoUrl,
      faviconUrl: formData.faviconUrl,
      aboutUs: formData.aboutUs,
      supportEmail: formData.supportEmail,
      phoneNumber: formData.phoneNumber,
      physicalAddress: {
        addressLine1: formData.physicalAddressAddressLine1,
        addressLine2: formData.physicalAddressAddressLine2,
        city: formData.physicalAddressCity,
        state: formData.physicalAddressState,
        postalCode: formData.physicalAddressPostalCode,
        country: formData.physicalAddressCountry,
        // coordinates can be handled separately if needed
      },
      socialLinks: {
        facebook: formData.socialLinksFacebook,
        twitter: formData.socialLinksTwitter,
        instagram: formData.socialLinksInstagram,
        youtube: formData.socialLinksYoutube,
        linkedin: formData.socialLinksLinkedin,
      },
      ecoStatement: formData.ecoStatement,
      storePolicies: {
        terms: formData.storePoliciesTerms,
        privacy: formData.storePoliciesPrivacy,
        returns: formData.storePoliciesReturns,
      },
      safetyMeasures: formData.safetyMeasures,
      area: formData.area,
      // Add other fields as necessary
    };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/warehouses/${sellerId}/${warehouseId}`,
        updatedData
      );
      setSuccess('Warehouse updated successfully.');
      setError(null);
      setWarehouse(res.data.data);
      refreshWarehouses(); // Refresh the warehouses list in parent component
      toast.success('Warehouse updated successfully!'); // Optional: Using toast for success notification
    } catch (err) {
      console.error('Failed to update warehouse', err);
      setError('Failed to update warehouse.');
      setSuccess(null);
      toast.error('Failed to update warehouse.'); // Optional: Using toast for error notification
    } finally {
      setLoading(false);
    }
  };

  if (!warehouseId) {
    return <DetailsContainer>Please select a warehouse to view details.</DetailsContainer>;
  }

  if (loading && !warehouse) {
    return <DetailsContainer>Loading...</DetailsContainer>;
  }

  if (error && !warehouse) {
    return <DetailsContainer><ErrorMessage>{error}</ErrorMessage></DetailsContainer>;
  }

  return (
    <DetailsContainer>
      <h3>Warehouse Details</h3>
      {loading && <p>Loading...</p>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      {warehouse && (
        <form onSubmit={handleSubmit}>
          {/* Warehouse Name */}
          <DetailField>
            <Label htmlFor="warehouseName">Warehouse Name</Label>
            <Input
              type="text"
              id="warehouseName"
              name="warehouseName"
              value={formData.warehouseName}
              onChange={handleChange}
              required
            />
          </DetailField>

          {/* Tagline */}
          <DetailField>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              type="text"
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
            />
          </DetailField>

          {/* Support Email */}
          <DetailField>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              type="email"
              id="supportEmail"
              name="supportEmail"
              value={formData.supportEmail}
              onChange={handleChange}
              required
            />
          </DetailField>

          {/* Phone Number */}
          <DetailField>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </DetailField>

          {/* Physical Address */}
          <h4>Physical Address</h4>
          <DetailField>
            <Label htmlFor="physicalAddressAddressLine1">Address Line 1</Label>
            <Input
              type="text"
              id="physicalAddressAddressLine1"
              name="physicalAddressAddressLine1"
              value={formData.physicalAddressAddressLine1}
              onChange={handleChange}
              required
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="physicalAddressAddressLine2">Address Line 2</Label>
            <Input
              type="text"
              id="physicalAddressAddressLine2"
              name="physicalAddressAddressLine2"
              value={formData.physicalAddressAddressLine2}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="physicalAddressCity">City</Label>
            <Input
              type="text"
              id="physicalAddressCity"
              name="physicalAddressCity"
              value={formData.physicalAddressCity}
              onChange={handleChange}
              required
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="physicalAddressState">State</Label>
            <Input
              type="text"
              id="physicalAddressState"
              name="physicalAddressState"
              value={formData.physicalAddressState}
              onChange={handleChange}
              required
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="physicalAddressPostalCode">Postal Code</Label>
            <Input
              type="text"
              id="physicalAddressPostalCode"
              name="physicalAddressPostalCode"
              value={formData.physicalAddressPostalCode}
              onChange={handleChange}
              required
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="physicalAddressCountry">Country</Label>
            <Input
              type="text"
              id="physicalAddressCountry"
              name="physicalAddressCountry"
              value={formData.physicalAddressCountry}
              onChange={handleChange}
              required
            />
          </DetailField>

          {/* Social Links */}
          <h4>Social Links</h4>
          <DetailField>
            <Label htmlFor="socialLinksFacebook">Facebook</Label>
            <Input
              type="url"
              id="socialLinksFacebook"
              name="socialLinksFacebook"
              value={formData.socialLinksFacebook}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="socialLinksTwitter">Twitter</Label>
            <Input
              type="url"
              id="socialLinksTwitter"
              name="socialLinksTwitter"
              value={formData.socialLinksTwitter}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="socialLinksInstagram">Instagram</Label>
            <Input
              type="url"
              id="socialLinksInstagram"
              name="socialLinksInstagram"
              value={formData.socialLinksInstagram}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="socialLinksYoutube">YouTube</Label>
            <Input
              type="url"
              id="socialLinksYoutube"
              name="socialLinksYoutube"
              value={formData.socialLinksYoutube}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="socialLinksLinkedin">LinkedIn</Label>
            <Input
              type="url"
              id="socialLinksLinkedin"
              name="socialLinksLinkedin"
              value={formData.socialLinksLinkedin}
              onChange={handleChange}
            />
          </DetailField>

          {/* Eco Statement */}
          <DetailField>
            <Label htmlFor="ecoStatement">Eco Statement</Label>
            <TextArea
              id="ecoStatement"
              name="ecoStatement"
              value={formData.ecoStatement}
              onChange={handleChange}
            />
          </DetailField>

          {/* Store Policies */}
          <h4>Store Policies</h4>
          <DetailField>
            <Label htmlFor="storePoliciesTerms">Terms</Label>
            <TextArea
              id="storePoliciesTerms"
              name="storePoliciesTerms"
              value={formData.storePoliciesTerms}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="storePoliciesPrivacy">Privacy</Label>
            <TextArea
              id="storePoliciesPrivacy"
              name="storePoliciesPrivacy"
              value={formData.storePoliciesPrivacy}
              onChange={handleChange}
            />
          </DetailField>
          <DetailField>
            <Label htmlFor="storePoliciesReturns">Returns</Label>
            <TextArea
              id="storePoliciesReturns"
              name="storePoliciesReturns"
              value={formData.storePoliciesReturns}
              onChange={handleChange}
            />
          </DetailField>

          {/* Safety Measures */}
          <DetailField>
            <Label htmlFor="safetyMeasures">Safety Measures</Label>
            <TextArea
              id="safetyMeasures"
              name="safetyMeasures"
              value={formData.safetyMeasures}
              onChange={handleChange}
            />
          </DetailField>

          {/* Area */}
          <DetailField>
            <Label htmlFor="area">Area (sq ft)</Label>
            <Input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
            />
          </DetailField>

          {/* Submit Button */}
          <Button type="submit" disabled={loading || !warehouseId}>
            {loading ? 'Updating...' : 'Update Warehouse'}
          </Button>
        </form>
      )}
    </DetailsContainer>
  );
}
