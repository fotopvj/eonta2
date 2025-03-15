import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Volume2, Settings, User, Menu, X, Trash2, Download, Share2 } from 'lucide-react';

// Sample composition data for demonstration
const sampleComposition = {
  title: "Washington Square Park Soundscape",
  description: "An immersive audio experience of Washington Square Park",
  creator: "John Doe",
  isPublic: true,
  location: {
    name: "Washington Square Park, NYC"
  },
  audioRegions: [
    { id: "1", name: "Fountain Area", volume: 80 },
    { id: "2", name: "Eastern Pathways", volume: 65 },
    { id: "3", name: "Western Garden", volume: 72 },
    { id: "4", name: "Northern Plaza", volume: 55 }
  ]
};

const EontaCompositionViewer = () => {
  const [composition, setComposition] = useState(sampleComposition);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('regions');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Format region list items with volume sliders
  const renderRegionList = () => {
    return composition.audioRegions.map(region => (
      <div key={region.id} className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white">{region.name}</h3>
          <button className="text-gray-500 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        </div>
        
        <div className="flex items-center">
          <Volume2 size={18} className="mr-2 text-gray-500" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={region.volume} 
            onChange={(e) => handleVolumeChange(region.id, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300 w-8">{region.volume}%</span>
        </div>
      </div>
    ));
  };

  // Handle volume change for an audio region
  const handleVolumeChange = (regionId, newVolume) => {
    setComposition(prev => ({
      ...prev,
      audioRegions: prev.audioRegions.map(region => 
        region.id === regionId ? { ...region, volume: newVolume } : region
      )
    }));
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">EONTA</h1>
          <div className="hidden md:flex ml-6 space-x-1">
            <button 
              onClick={() => setActiveTab('regions')}
              className={`px-3 py-1 rounded-md ${activeTab === 'regions' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Regions
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 rounded-md ${activeTab === 'settings' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Settings
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <User size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <button 
            onClick={toggleMobileMenu} 
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 px-4 py-2 shadow-sm">
          <button 
            onClick={() => {setActiveTab('regions'); setIsMobileMenuOpen(false);}}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Regions
          </button>
          <button 
            onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Settings
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Area */}
        {isMapVisible && (
          <div className="flex-1 bg-gray-300 dark:bg-gray-700 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Interactive Map Area<br/>
                (Google Maps API Integration)
              </p>
            </div>
            
            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <button className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <MapPin size={20} className="text-blue-500" />
              </button>
              <button 
                onClick={() => setIsMapVisible(false)}
                className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Layers size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
        
        {/* Side Panel */}
        <div className={`${isMapVisible ? 'w-1/3 min-w-64 border-l' : 'w-full'} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-y-auto`}>
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold">{composition.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">By {composition.creator}</p>
              <p className="mt-2 text-sm">{composition.description}</p>
              
              <div className="flex items-center mt-3 space-x-2">
                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <MapPin size={14} className="mr-1" /> {composition.location.name}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${composition.isPublic ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                  {composition.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button 
                onClick={() => setActiveTab('regions')}
                className={`py-2 px-4 font-medium text-sm ${activeTab === 'regions' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Audio Regions
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-4 font-medium text-sm ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Settings
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'regions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Audio Regions</h3>
                  <button className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                    <Plus size={16} className="mr-1" /> Add Region
                  </button>
                </div>
                
                {renderRegionList()}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h3 className="font-medium mb-4">Composition Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Master Volume</span>
                    <div className="flex items-center w-32">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue="80" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm w-8">80%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Audition Mode</span>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Show Transition Zones</span>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform"></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full py-2 px-4 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center">
                      <Download size={16} className="mr-2" /> Export Composition
                    </button>
                    
                    <button className="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                      <Share2 size={16} className="mr-2" /> Share Composition
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Action Button (mobile) */}
      <div className="md:hidden fixed right-4 bottom-4">
        <button 
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="p-4 bg-blue-600 rounded-full shadow-lg text-white"
        >
          {isMapVisible ? <Layers size={24} /> : <MapPin size={24} />}
        </button>
      </div>
    </div>
  );
};

export default EontaCompositionViewer;