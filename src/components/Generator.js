import React, { useState } from 'react';

function Generator({ onSpecGenerated }) {
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    dimensions: '',
    materials: '',
    colors: '',
    weight: '',
    standards: '',
    moq: '',
    leadTime: '',
    pricingTier: '',
    qualityAssurance: '',
    shipping: '',
    imagePlacement: 'top-right'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert image to base64
      let imageBase64 = null;
      if (imageFile) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch('/.netlify/functions/generate-spec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageBase64,
          imageMimeType: imageFile?.type || 'image/jpeg'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate spec sheet');
      }

      // Download the generated Word document
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.productName}_spec_sheet.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`✓ Spec sheet generated and saved to archive!`);
      
      // Notify parent to refresh archive
      if (onSpecGenerated) onSpecGenerated();

      // Reset form after success
      setTimeout(() => {
        setFormData({
          productName: '',
          productDescription: '',
          dimensions: '',
          materials: '',
          colors: '',
          weight: '',
          standards: '',
          moq: '',
          leadTime: '',
          pricingTier: '',
          qualityAssurance: '',
          shipping: '',
          imagePlacement: 'top-right'
        });
        setImageFile(null);
        setImagePreview(null);
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error generating spec sheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {/* Product Overview Section */}
        <fieldset className="form-section">
          <legend>Product Overview</legend>
          <div className="form-group">
            <label htmlFor="productName">Product Name *</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              required
              placeholder="e.g., Proclamation & Resolution Frame"
            />
          </div>

          <div className="form-group">
            <label htmlFor="productDescription">Product Description *</label>
            <textarea
              id="productDescription"
              name="productDescription"
              value={formData.productDescription}
              onChange={handleInputChange}
              required
              placeholder="Brief description of the product"
              rows="3"
            />
          </div>
        </fieldset>

        {/* Specifications Section */}
        <fieldset className="form-section">
          <legend>Specifications</legend>
          <div className="form-group">
            <label htmlFor="dimensions">Dimensions (e.g., 34cm W x 49cm H) *</label>
            <input
              type="text"
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              required
              placeholder="Include width, height, depth if applicable"
            />
          </div>

          <div className="form-group">
            <label htmlFor="materials">Materials *</label>
            <textarea
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleInputChange}
              required
              placeholder="e.g., High-Grade Wood Molding, Clear Glass, Black Mat Board with Gold Border"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="colors">Available Colors</label>
            <input
              type="text"
              id="colors"
              name="colors"
              value={formData.colors}
              onChange={handleInputChange}
              placeholder="e.g., Black, White, Natural Wood"
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight</label>
            <input
              type="text"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              placeholder="e.g., 2.5 kg"
            />
          </div>
        </fieldset>

        {/* Standards & Certifications */}
        <fieldset className="form-section">
          <legend>Standards & Certifications</legend>
          <div className="form-group">
            <label htmlFor="standards">Applicable Standards & Certifications</label>
            <textarea
              id="standards"
              name="standards"
              value={formData.standards}
              onChange={handleInputChange}
              placeholder="e.g., ISO 9001, CE Marking, Custom Customization Available"
              rows="2"
            />
          </div>
        </fieldset>

        {/* Ordering Info */}
        <fieldset className="form-section">
          <legend>Ordering Information</legend>
          <div className="form-group">
            <label htmlFor="moq">Minimum Order Quantity (MOQ) *</label>
            <input
              type="text"
              id="moq"
              name="moq"
              value={formData.moq}
              onChange={handleInputChange}
              required
              placeholder="e.g., 100 units"
            />
          </div>

          <div className="form-group">
            <label htmlFor="leadTime">Lead Time *</label>
            <input
              type="text"
              id="leadTime"
              name="leadTime"
              value={formData.leadTime}
              onChange={handleInputChange}
              required
              placeholder="e.g., 30-45 days"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pricingTier">Pricing Tier / Pricing Information *</label>
            <textarea
              id="pricingTier"
              name="pricingTier"
              value={formData.pricingTier}
              onChange={handleInputChange}
              required
              placeholder="e.g., Volume-based pricing available. Contact for quote."
              rows="2"
            />
          </div>
        </fieldset>

        {/* Quality Assurance */}
        <fieldset className="form-section">
          <legend>Quality Assurance</legend>
          <div className="form-group">
            <label htmlFor="qualityAssurance">Quality Control & Testing Procedures</label>
            <textarea
              id="qualityAssurance"
              name="qualityAssurance"
              value={formData.qualityAssurance}
              onChange={handleInputChange}
              placeholder="e.g., 100% visual inspection, Drop testing, Dimensional verification"
              rows="2"
            />
          </div>
        </fieldset>

        {/* Shipping & Packaging */}
        <fieldset className="form-section">
          <legend>Shipping & Packaging</legend>
          <div className="form-group">
            <label htmlFor="shipping">Packaging & Shipping Details</label>
            <textarea
              id="shipping"
              name="shipping"
              value={formData.shipping}
              onChange={handleInputChange}
              placeholder="e.g., Individually shrink-wrapped. Dual-purpose mailer box. 10 units per carton."
              rows="2"
            />
          </div>
        </fieldset>

        {/* Image Upload & Placement */}
        <fieldset className="form-section">
          <legend>Product Image</legend>
          <div className="form-group">
            <label htmlFor="imageUpload">Upload Product Image *</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {imagePreview && (
              <div className="image-preview">
                <p>Preview:</p>
                <img src={imagePreview} alt="Product preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="imagePlacement">Image Placement in Spec Sheet</label>
            <select
              id="imagePlacement"
              name="imagePlacement"
              value={formData.imagePlacement}
              onChange={handleInputChange}
            >
              <option value="top-right">Top Right (Recommended)</option>
              <option value="top-center">Top Center</option>
              <option value="top-full">Top Full Width</option>
              <option value="left-sidebar">Left Sidebar</option>
            </select>
          </div>
        </fieldset>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Generating Spec Sheet...' : 'Generate Spec Sheet (English + Chinese)'}
        </button>
      </form>
    </div>
  );
}

export default Generator;
