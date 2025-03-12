import React, { useState, useEffect } from 'react';
import { LayoutGrid, Grid3X3, Grid2X2, Smartphone, CheckCircle2, X, UserCircle2 } from 'lucide-react';
import { TraderProfileType, TraderProfile } from '../../types/dashboard';

interface DashboardPreferencesProps {
  onSave: (preferences: {
    columns: number;
    visibleCards: string[];
    traderProfile: TraderProfileType;
  }) => void;
  onClose: () => void;
  defaultColumns?: number;
  availableCards: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  traderProfiles: TraderProfile[];
  activeProfile: TraderProfileType;
}

export const DashboardPreferences: React.FC<DashboardPreferencesProps> = ({
  onSave,
  onClose,
  defaultColumns = 3,
  availableCards,
  traderProfiles,
  activeProfile
}) => {
  const [columns, setColumns] = useState(defaultColumns);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<TraderProfileType>(activeProfile);
  
  // Update selected cards when trader profile changes
  useEffect(() => {
    if (selectedProfile === 'custom') {
      // For custom profile, don't change the selections
      return;
    }
    
    // Find the selected profile and apply its settings
    const profile = traderProfiles.find(p => p.id === selectedProfile);
    if (profile) {
      setColumns(profile.columns);
      setSelectedCards(profile.visibleCards);
    }
  }, [selectedProfile, traderProfiles]);

  // Initialize selected cards on component mount
  useEffect(() => {
    // If we have an active profile, use it
    if (activeProfile) {
      setSelectedProfile(activeProfile);
      
      // Find the profile to get its cards
      const profile = traderProfiles.find(p => p.id === activeProfile);
      if (profile) {
        setColumns(profile.columns);
        setSelectedCards(profile.visibleCards);
      } else {
        // Fallback to showing all cards if profile not found
        setSelectedCards(availableCards.map(card => card.id));
      }
    } else {
      // Default to all cards selected if no profile
      setSelectedCards(availableCards.map(card => card.id));
    }
  }, [activeProfile, availableCards, traderProfiles]);
  
  const handleSave = () => {
    onSave({
      columns,
      visibleCards: selectedCards,
      traderProfile: selectedProfile
    });
    onClose();
  };
  
  const toggleCard = (cardId: string) => {
    // If not in custom mode, switch to custom mode first
    if (selectedProfile !== 'custom') {
      setSelectedProfile('custom');
    }
    
    setSelectedCards(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleProfileChange = (profileId: TraderProfileType) => {
    setSelectedProfile(profileId);
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0C1016] border border-viridian/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to TradesXBT</h2>
              <p className="text-gray-400">Let's customize your dashboard experience</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-viridian/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-8">
            {/* Trader Profile Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserCircle2 size={20} className="text-viridian" />
                Choose Your Trader Profile
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {traderProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileChange(profile.id)}
                    className={`p-4 rounded-lg border flex items-start ${
                      selectedProfile === profile.id 
                        ? 'bg-viridian/20 border-viridian text-viridian' 
                        : 'border-gray-700 text-gray-400 hover:border-viridian/50'
                    } transition-colors`}
                  >
                    <div className={`mt-0.5 mr-3 ${selectedProfile === profile.id ? 'text-viridian' : 'text-gray-500'}`}>
                      <CheckCircle2 size={20} className={selectedProfile === profile.id ? 'opacity-100' : 'opacity-30'} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{profile.name}</div>
                      <div className="text-xs mt-1 text-gray-400">{profile.description}</div>
                      {profile.id !== 'custom' && (
                        <div className="text-xs mt-2 text-gray-500">
                          {profile.visibleCards.length} components • {profile.columns} column layout
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Layout Selection - Only show for custom profile */}
            {selectedProfile === 'custom' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <LayoutGrid size={20} className="text-viridian" />
                  Choose Your Layout
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setColumns(1)}
                    className={`p-4 rounded-lg border ${
                      columns === 1 
                        ? 'bg-viridian/20 border-viridian text-viridian' 
                        : 'border-gray-700 text-gray-400 hover:border-viridian/50'
                    } transition-colors`}
                  >
                    <Smartphone size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">Single Column</div>
                    <div className="text-xs opacity-70">Best for mobile</div>
                  </button>
                  
                  <button
                    onClick={() => setColumns(2)}
                    className={`p-4 rounded-lg border ${
                      columns === 2 
                        ? 'bg-viridian/20 border-viridian text-viridian' 
                        : 'border-gray-700 text-gray-400 hover:border-viridian/50'
                    } transition-colors`}
                  >
                    <Grid2X2 size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">Two Columns</div>
                    <div className="text-xs opacity-70">Balanced view</div>
                  </button>
                  
                  <button
                    onClick={() => setColumns(3)}
                    className={`p-4 rounded-lg border ${
                      columns === 3 
                        ? 'bg-viridian/20 border-viridian text-viridian' 
                        : 'border-gray-700 text-gray-400 hover:border-viridian/50'
                    } transition-colors`}
                  >
                    <Grid3X3 size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium">Three Columns</div>
                    <div className="text-xs opacity-70">Full experience</div>
                  </button>
                </div>
              </div>
            )}
            
            {/* Card selection - Only show for custom profile */}
            {selectedProfile === 'custom' && (
              <div className="mt-8 space-y-6">
                <h3 className="text-white font-medium">Select Dashboard Cards</h3>
                
                {/* Original Dashboard Cards */}
                <div className="bg-black/30 p-4 rounded-lg mb-6">
                  <h4 className="text-viridian font-medium mb-3">Main Dashboard Cards</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCards.slice(0, 6).map(card => (
                      <div
                        key={card.id}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedCards.includes(card.id)
                            ? 'bg-viridian/20 border border-viridian'
                            : 'bg-black/50 border border-gray-800 hover:border-viridian/50'
                        }`}
                        onClick={() => toggleCard(card.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-white">{card.title}</h5>
                            <p className="text-sm text-gray-400 mt-1">{card.description}</p>
                          </div>
                          <div className={`${
                            selectedCards.includes(card.id) ? 'text-viridian' : 'text-gray-600'
                          }`}>
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* AI Tool Cards */}
                <div className="bg-black/30 p-4 rounded-lg">
                  <h4 className="text-viridian font-medium mb-3">AI Analysis Tools</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCards.slice(6).map(card => (
                      <div
                        key={card.id}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedCards.includes(card.id)
                            ? 'bg-viridian/20 border border-viridian'
                            : 'bg-black/50 border border-gray-800 hover:border-viridian/50'
                        }`}
                        onClick={() => toggleCard(card.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-white">{card.title}</h5>
                            <p className="text-sm text-gray-400 mt-1">{card.description}</p>
                          </div>
                          <div className={`${
                            selectedCards.includes(card.id) ? 'text-viridian' : 'text-gray-600'
                          }`}>
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-viridian text-white rounded-lg hover:bg-viridian/90 transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};