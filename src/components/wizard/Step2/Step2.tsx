import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Trash2,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { useStationStore } from '@/store/useStationStore';
import { useWizardStore } from '@/store/useWizardStore';
import { useAppStore } from '@/lib/store/app-store';
import ModernNavigation from '../ModernNavigation';
import { useStep2Logic } from './hooks/useStep2Logic';
import SearchBar from './components/SearchBar';
import ViewSwitcher from './components/ViewSwitcher';
import TabContent from './components/TabContent';
import FloatingActionPanel from './components/FloatingActionPanel';
import toast from 'react-hot-toast';
import Step2CommandDialog from './components/CommandDialog';

const Step2: React.FC = () => {
  const { getStationsByType, getReviereByPraesidium, loadStations, stations } = useStationStore();
  const { setSelectedStations, setSelectedCustomAddresses } = useWizardStore();
  const { setSelectedStations: setAppSelectedStations, setSelectedCustomAddresses: setAppSelectedCustomAddresses } = useAppStore();
  
  // Modernes State-Management für Adressbearbeitung
  const [editAddress, setEditAddress] = useState<any | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Lade Stationen beim Mounten der Komponente
  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Reset-Auswahl beim Laden von Schritt 2
  useEffect(() => {
    // Setze die Auswahl in beiden Stores zurück
    setSelectedStations([]);
    setSelectedCustomAddresses([]);
    setAppSelectedStations([]);
    setAppSelectedCustomAddresses([]);
    
    // Entferne auch aus localStorage falls vorhanden
    try {
      localStorage.removeItem('wizard-store');
      console.log('🔄 Step2: Alle Auswahlen zurückgesetzt');
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Auswahl:', error);
    }
  }, [setSelectedStations, setSelectedCustomAddresses, setAppSelectedStations, setAppSelectedCustomAddresses]);

  // Debug: Log wenn Stationen geladen sind
  useEffect(() => {
    console.log('🔍 Step2: Stationen geladen:', stations.length);
    const praesidien = getStationsByType('praesidium');
    const reviere = getStationsByType('revier');
    console.log('🔍 Step2: Präsidien:', praesidien.length, 'Reviere:', reviere.length);
  }, [stations, getStationsByType]);
  
  const {
    // States
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    isPanelOpen,
    setIsPanelOpen,
    searchQuery,
    setSearchQuery,
    showAddForm,
    setShowAddForm,
    expandedPraesidien,
    formData,
    setFormData,
    routes,
    isLoading,
    searchInputRef,
    
    // Store data
    selectedStations,
    selectedCustomAddresses,
    customAddresses,
    praesidiumWithReviere,
    
    // Functions
    togglePraesidiumWithReviere,
    handleStationToggle,
    togglePraesidiumExpansion,
    handleCustomToggle,
    handleAddAddress,
    handleDeleteAddress,
    handleEditAddress,
    handleContinue,
    announceToScreenReader
  } = useStep2Logic();

  const { addCustomAddress } = useAppStore();

  // Moderne Handler für Adressbearbeitung
  const handleEditTemporary = (address: any) => {
    setEditAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      zipCode: address.zipCode,
      city: address.city,
      addressType: address.addressType as 'temporary' | 'permanent',
      parentId: address.parentId
    });
    setShowEditForm(true);
    setIsEditing(true);
  };

  const handleEditPermanent = async (address: any) => {
    try {
      setIsEditing(true);
      
      try {
        const response = await fetch(`/api/addresses/${address.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${userToken}` // Falls Authentifizierung benötigt
          },
          body: JSON.stringify({
            ...address,
            name: formData.name,
            street: formData.street,
            zipCode: formData.zipCode,
            city: formData.city,
            parentId: formData.parentId
          })
        });
        
        if (!response.ok) {
          throw new Error('Backend nicht verfügbar');
        }
        
        const updatedAddress = await response.json();
        
        // Optimistisches UI-Update
        handleEditAddress(updatedAddress);
        toast.success('Adresse erfolgreich aktualisiert');
      } catch (backendError) {
        console.warn('Backend nicht verfügbar, bearbeite nur lokal:', backendError);
        
        // Fallback: Lokale Bearbeitung
        const updatedAddress = { ...address, ...formData };
        handleEditAddress(updatedAddress);
        toast.success('Adresse lokal aktualisiert (Backend nicht verfügbar)');
      }
    } catch (error) {
      console.error('Fehler beim Bearbeiten:', error);
      toast.error('Fehler beim Bearbeiten der Adresse');
    } finally {
      setIsEditing(false);
      setShowEditForm(false);
      setEditAddress(null);
    }
  };

  // Erweiterter Delete-Handler
  const handleDeleteAddressWithAPI = async (id: string) => {
    try {
      // Temporäre Adresse löschen (Client-Side)
      const addressToDelete = customAddresses.find(addr => addr.id === id);
      if (addressToDelete?.addressType === 'temporary') {
        handleDeleteAddress(id);
        toast.success('Temporäre Adresse gelöscht');
        return;
      }
      
      // Permanente Adresse löschen (API-Call)
      try {
        const response = await fetch(`/api/addresses/${id}`, {
          method: 'DELETE',
          headers: {
            // 'Authorization': `Bearer ${userToken}` // Falls Authentifizierung benötigt
          }
        });
        
        if (!response.ok) {
          throw new Error('Backend nicht verfügbar');
        }
        
        // Optimistisches UI-Update
        handleDeleteAddress(id);
        toast.success('Adresse erfolgreich gelöscht');
      } catch (backendError) {
        console.warn('Backend nicht verfügbar, lösche nur lokal:', backendError);
        
        // Fallback: Lokale Löschung
        handleDeleteAddress(id);
        toast.success('Adresse lokal gelöscht (Backend nicht verfügbar)');
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast.error('Fehler beim Löschen der Adresse');
    }
  };

  // Handler für Edit-Submit
  const handleEditSubmit = (updatedFormData: any) => {
    if (editAddress?.addressType === 'temporary') {
      // Client-seitige Aktualisierung für temporäre Adressen
      const updatedAddress = { ...editAddress, ...updatedFormData };
      handleEditAddress(updatedAddress);
      toast.success('Temporäre Adresse aktualisiert');
    } else {
      // Server-seitige Aktualisierung für permanente Adressen
      handleEditPermanent(editAddress);
    }
    
    setShowEditForm(false);
    setEditAddress(null);
    setIsEditing(false);
  };

  // Sprachsteuerung und Befehle Funktionen
  const handleVoiceCommand = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        toast.success('Sprachsteuerung aktiviert - Sprechen Sie jetzt');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        toast.success(`Erkannt: "${transcript}"`);
        
        // Sprachbefehle verarbeiten
        if (transcript.includes('stuttgart') || transcript.includes('stuttgarter')) {
          // Alle Stuttgarter Stationen auswählen
          const stuttgartStations = praesidiumWithReviere
            .filter(p => p.city.toLowerCase().includes('stuttgart'))
            .flatMap(p => [p.id, ...p.reviere.map(r => r.id)]);
          setSelectedStations([...new Set([...selectedStations, ...stuttgartStations])]);
          toast.success('Alle Stuttgarter Stationen ausgewählt');
        } else if (transcript.includes('alle') || transcript.includes('select all')) {
          // Alle sichtbaren Stationen auswählen
          const allVisible = praesidiumWithReviere.flatMap(p => [p.id, ...p.reviere.map(r => r.id)]);
          setSelectedStations([...new Set([...selectedStations, ...allVisible])]);
          toast.success('Alle Stationen ausgewählt');
        } else if (transcript.includes('nichts') || transcript.includes('clear')) {
          // Auswahl löschen
          setSelectedStations([]);
          toast.success('Auswahl gelöscht');
        } else if (transcript.includes('weiter') || transcript.includes('continue')) {
          // Zu Step 3 weitergehen
          handleContinue();
        }
      };
      
      recognition.onerror = (event: any) => {
        toast.error('Fehler bei der Spracherkennung');
        console.error('Speech recognition error:', event.error);
      };
      
      recognition.onend = () => {
        toast.success('Sprachsteuerung beendet');
      };
      
      recognition.start();
    } else {
      toast.error('Sprachsteuerung wird in diesem Browser nicht unterstützt');
    }
  };

  // State für Command Dialog
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);

  const handleCommandDialog = () => {
    setIsCommandDialogOpen(true);
  };

  const handleCommandExecute = (commandKey: string) => {
    const commands = [
      { 
        key: 'stuttgart', 
        action: () => {
          const stuttgartStations = praesidiumWithReviere
            .filter(p => p.city.toLowerCase().includes('stuttgart'))
            .flatMap(p => [p.id, ...p.reviere.map(r => r.id)]);
          setSelectedStations([...new Set([...selectedStations, ...stuttgartStations])]);
          toast.success('Alle Stuttgarter Stationen ausgewählt');
        }
      },
      { 
        key: 'alle', 
        action: () => {
          const allStations = praesidiumWithReviere.flatMap(p => [p.id, ...p.reviere.map(r => r.id)]);
          setSelectedStations([...new Set([...selectedStations, ...allStations])]);
          toast.success('Alle Stationen ausgewählt');
        }
      },
      { 
        key: 'clear', 
        action: () => {
          setSelectedStations([]);
          toast.success('Auswahl gelöscht');
        }
      },
      { 
        key: 'weiter', 
        action: () => {
          handleContinue();
        }
      }
    ];
    
    const selectedCommand = commands.find(cmd => cmd.key === commandKey);
    if (selectedCommand) {
      selectedCommand.action();
    }
  };

  const commandList = [
    { 
      key: 'stuttgart', 
      label: 'Alle Stuttgarter Stationen auswählen', 
      description: 'Wählt alle Polizeistationen in Stuttgart aus',
      icon: Building
    },
    { 
      key: 'alle', 
      label: 'Alle Stationen auswählen', 
      description: 'Wählt alle verfügbaren Polizeistationen aus',
      icon: Building
    },
    { 
      key: 'clear', 
      label: 'Auswahl löschen', 
      description: 'Entfernt alle ausgewählten Stationen',
      icon: Trash2
    },
    { 
      key: 'weiter', 
      label: 'Zu Step 3 weitergehen', 
      description: 'Wechselt zum nächsten Schritt',
      icon: ArrowRight
    }
  ];

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K oder Ctrl+K für Befehle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleCommandDialog();
      }
      
      // Cmd+Shift+V oder Ctrl+Shift+V für Sprachsteuerung
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        handleVoiceCommand();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tabs = [
    {
      id: 'stations',
      label: 'Polizeistationen',
      icon: Building,
      count: selectedStations.length
    },
    {
      id: 'custom',
      label: 'Eigene Adressen',
      icon: MapPin,
      count: selectedCustomAddresses.length
    }
  ];

  const totalSelected = selectedStations.length + selectedCustomAddresses.length;

  // Marker click handler
  const handleMarkerClick = (route: any) => {
    const id = route.id;
    if (selectedStations.includes(id)) {
      setSelectedStations(selectedStations.filter(sid => sid !== id));
    } else {
      setSelectedStations([...selectedStations, id]);
    }
  };

  // Berechne Statistiken für die Anzeige
  const selectedPraesidien = praesidiumWithReviere.filter(p => selectedStations.includes(p.id));
  const selectedReviere = selectedStations.filter(id => 
    praesidiumWithReviere.some(p => p.reviere.some(r => r.id === id))
  );
  const selectedCustomCount = selectedCustomAddresses.length;

  // Verfügbare Präsidien für Adress-Formular
  const availablePraesidien = praesidiumWithReviere.map(p => ({
    id: p.id,
    name: p.name,
    city: p.city
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Professionelle Status-Anzeige */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-blue-200/50 dark:border-blue-800/50"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Hauptstatus */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              {totalSelected > 0 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">
                  {totalSelected}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSelected === 0 ? 'Keine Ziele ausgewählt' : `${totalSelected} Ziele ausgewählt`}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {totalSelected === 0 
                  ? 'Wählen Sie Polizeistationen oder eigene Adressen aus' 
                  : 'Bereit für die Routenberechnung'
                }
              </p>
            </div>
          </div>

          {/* Detaillierte Statistiken */}
          {totalSelected > 0 && (
            <div className="flex flex-wrap gap-4">
              {selectedPraesidien.length > 0 && (
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedPraesidien.length} Präsidien
                  </span>
                </div>
              )}
              {selectedReviere.length > 0 && (
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedReviere.length} Reviere
                  </span>
                </div>
              )}
              {selectedCustomCount > 0 && (
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedCustomCount} Eigene Adressen
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fortschrittsbalken */}
        {totalSelected > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Auswahl-Fortschritt</span>
              <span>{totalSelected} von {praesidiumWithReviere.length + selectedCustomCount} möglichen Zielen</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSelected / (praesidiumWithReviere.length + selectedCustomCount)) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Header mit Such- und Ansichts-Optionen */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative flex-1 max-w-xl">
          {/* Suchleiste */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onVoiceCommand={handleVoiceCommand}
            onCommand={handleCommandDialog}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Switcher */}
          <ViewSwitcher activeView={activeView} setActiveView={setActiveView} />
        </div>
      </div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'stations' | 'custom')}
                className={`flex-1 flex items-center justify-center space-x-3 py-6 px-4 font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <TabContent
            activeTab={activeTab}
            activeView={activeView}
            searchQuery={searchQuery}
            praesidiumWithReviere={praesidiumWithReviere}
            selectedStations={selectedStations}
            expandedPraesidien={expandedPraesidien}
            customAddresses={customAddresses}
            selectedCustomAddresses={selectedCustomAddresses}
            routes={routes}
            showAddForm={showAddForm}
            formData={formData}
            setFormData={setFormData}
            onTogglePraesidium={togglePraesidiumWithReviere}
            onExpandPraesidium={togglePraesidiumExpansion}
            onStationToggle={handleStationToggle}
            onCustomToggle={handleCustomToggle}
            onAddAddress={handleAddAddress}
            onDeleteAddress={handleDeleteAddressWithAPI}
            onEditAddress={handleEditTemporary}
            onCancelAddForm={() => {
              setShowAddForm(false);
              setFormData({ name: '', street: '', zipCode: '', city: '', addressType: 'temporary', parentId: undefined });
            }}
            onToggleAddForm={() => setShowAddForm(!showAddForm)}
            onMarkerClick={handleMarkerClick}
            availablePraesidien={availablePraesidien}
            currentUser={{ id: 'user-123', role: 'user' }}
            editAddress={editAddress}
            onEditSubmit={handleEditSubmit}
            isEditing={isEditing}
          />
        </div>
      </motion.div>

      {/* Floating Action Panel */}
      <FloatingActionPanel
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        isLoading={isLoading}
        totalSelected={totalSelected}
        selectedStations={selectedStations}
        selectedCustomAddresses={selectedCustomAddresses}
        stations={stations}
        customAddresses={customAddresses}
        onStationToggle={handleStationToggle}
        onCustomToggle={handleCustomToggle}
      />
      
      {/* Moderne Navigation */}
      <ModernNavigation totalSelected={totalSelected} onContinue={handleContinue} />

      {/* Command Dialog */}
      <Step2CommandDialog
        isOpen={isCommandDialogOpen}
        onClose={() => setIsCommandDialogOpen(false)}
        onCommand={handleCommandExecute}
        commands={commandList}
      />
    </div>
  );
};

export default Step2; 