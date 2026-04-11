import React, { useState } from 'react';
import './App.css';
import Generator from './components/Generator';
import Archive from './components/Archive';

function App() {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' or 'archive'
  const [refreshArchive, setRefreshArchive] = useState(0); // Trigger to refresh archive

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSpecGenerated = () => {
    // Trigger archive refresh when a new spec is generated
    setRefreshArchive(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Spec Sheet Generator & Archive</h1>
        <p>Create professional bilingual (English/Chinese) spec sheets + searchable archive</p>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => handleTabChange('generator')}
        >
          📝 Generate New
        </button>
        <button
          className={`tab-button ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => handleTabChange('archive')}
        >
          📚 Spec Archive
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'generator' && <Generator onSpecGenerated={handleSpecGenerated} />}
      {activeTab === 'archive' && <Archive refreshTrigger={refreshArchive} onLoadSpec={(spec) => {
        // Switch to generator and load the spec
        setActiveTab('generator');
      }} />}
    </div>
  );
}

export default App;
