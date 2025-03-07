import React, { useState } from 'react';
import { LayoutGrid, Grid3X3, Grid2X2, Smartphone, CheckCircle2, X } from 'lucide-react';

interface DashboardPreferencesProps {
  onSave: (preferences: {
    columns: number;
    visibleCards: string[];
  }) => void;
  onClose: () => void;
  defaultColumns?: number;
  availableCards: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export const DashboardPreferences: React.FC<DashboardPreferencesProps> = ({
  onSave,
  onClose,
  defaultColumns = 3,
  availableCards
}) => {
  const [columns, setColumns] = useState(defaultColumns);
  const [selectedCards, setSelectedCards] = useState<string[]>(availableCards.map(card => card.id));
  
  const handleSave = () => {
    onSave({
      columns,
      visibleCards: selectedCards
    });
    onClose();
  };
  
  const toggleCard = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
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
            {/* Layout Selection */}
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
            
            {/* Card Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Choose Your Widgets</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {availableCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`p-4 rounded-lg border text-left ${
                      selectedCards.includes(card.id)
                        ? 'bg-viridian/20 border-viridian'
                        : 'border-gray-700 hover:border-viridian/50'
                    } transition-colors relative group`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-medium mb-1 ${
                          selectedCards.includes(card.id) ? 'text-viridian' : 'text-white'
                        }`}>
                          {card.title}
                        </h4>
                        <p className="text-sm text-gray-400">{card.description}</p>
                      </div>
                      <CheckCircle2 
                        size={20} 
                        className={`transition-colors ${
                          selectedCards.includes(card.id)
                            ? 'text-viridian'
                            : 'text-gray-600 group-hover:text-gray-400'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-viridian text-white rounded-lg hover:bg-viridian/90 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};