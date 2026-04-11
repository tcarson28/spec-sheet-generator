import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function Archive({ refreshTrigger, onLoadSpec }) {
  const [specs, setSpecs] = useState([]);
  const [filteredSpecs, setFilteredSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'

  // Load specs from Supabase
  useEffect(() => {
    loadSpecs();
  }, [refreshTrigger]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('specs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSpecs(data || []);
      setFilteredSpecs(data || []);
    } catch (err) {
      setError(`Failed to load archive: ${err.message}`);
      console.error('Supabase error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    let results = specs;

    // Filter by search term
    if (searchTerm) {
      results = results.filter(spec =>
        spec.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.product_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'oldest') {
      results = [...results].reverse();
    }

    setFilteredSpecs(results);
  }, [searchTerm, sortBy, specs]);

  // Download spec as Word document
  const downloadSpec = async (spec) => {
    try {
      const response = await fetch('/.netlify/functions/generate-spec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: spec.product_name,
          productDescription: spec.product_description,
          dimensions: spec.dimensions,
          materials: spec.materials,
          colors: spec.colors,
          weight: spec.weight,
          standards: spec.standards,
          moq: spec.moq,
          leadTime: spec.lead_time,
          pricingTier: spec.pricing_tier,
          qualityAssurance: spec.quality_assurance,
          shipping: spec.shipping,
          imagePlacement: 'top-right',
          imageBase64: null // Could add image retrieval if stored
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${spec.product_name}_spec_sheet.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Failed to download: ${err.message}`);
    }
  };

  // Delete spec
  const deleteSpec = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spec?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('specs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSpecs(specs.filter(s => s.id !== id));
      setSelectedSpec(null);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="archive-container">
        <div className="loading">Loading your spec archive...</div>
      </div>
    );
  }

  return (
    <div className="archive-container">
      {/* Search and Filter */}
      <div className="archive-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search specs by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-box">
          <label htmlFor="sortSelect">Sort by:</label>
          <select
            id="sortSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {specs.length === 0 ? (
        <div className="empty-archive">
          <p>📭 No specs in your archive yet.</p>
          <p>Generate your first spec sheet using the "Generate New" tab!</p>
        </div>
      ) : (
        <div className="archive-content">
          {/* List View */}
          <div className="specs-list">
            <h3>Your Specs ({filteredSpecs.length})</h3>
            {filteredSpecs.length === 0 ? (
              <p className="no-results">No results match your search.</p>
            ) : (
              <div className="specs-grid">
                {filteredSpecs.map(spec => (
                  <div
                    key={spec.id}
                    className={`spec-card ${selectedSpec?.id === spec.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSpec(spec)}
                  >
                    <h4>{spec.product_name}</h4>
                    <p className="spec-desc">{spec.product_description?.substring(0, 60)}...</p>
                    <p className="spec-date">{formatDate(spec.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail View */}
          {selectedSpec && (
            <div className="spec-detail">
              <h3>{selectedSpec.product_name}</h3>
              <div className="spec-info">
                <div className="info-item">
                  <strong>Description:</strong>
                  <p>{selectedSpec.product_description}</p>
                </div>
                {selectedSpec.dimensions && (
                  <div className="info-item">
                    <strong>Dimensions:</strong>
                    <p>{selectedSpec.dimensions}</p>
                  </div>
                )}
                {selectedSpec.materials && (
                  <div className="info-item">
                    <strong>Materials:</strong>
                    <p>{selectedSpec.materials}</p>
                  </div>
                )}
                {selectedSpec.moq && (
                  <div className="info-item">
                    <strong>MOQ:</strong>
                    <p>{selectedSpec.moq}</p>
                  </div>
                )}
                {selectedSpec.lead_time && (
                  <div className="info-item">
                    <strong>Lead Time:</strong>
                    <p>{selectedSpec.lead_time}</p>
                  </div>
                )}
                <div className="info-item">
                  <strong>Created:</strong>
                  <p>{formatDate(selectedSpec.created_at)}</p>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="action-button download"
                  onClick={() => downloadSpec(selectedSpec)}
                >
                  📥 Download as Word
                </button>
                <button
                  className="action-button edit"
                  onClick={() => onLoadSpec?.(selectedSpec)}
                >
                  ✏️ Edit & Regenerate
                </button>
                <button
                  className="action-button delete"
                  onClick={() => deleteSpec(selectedSpec.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Archive;
