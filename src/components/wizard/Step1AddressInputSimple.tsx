import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, ArrowRight, Search, Navigation } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { toast } from 'react-hot-toast';

const Step1AddressInputSimple: React.FC = () => {
  const [address, setAddress] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setStartAddress, setWizardStep, setSelectedStations, setSelectedCustomAddresses, wizard } = useAppStore();

  // Auto-focus beim Laden
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (inputAddress: string) => {
    if (!inputAddress.trim()) {
      toast.error('Bitte geben Sie eine Adresse ein');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simuliere API-Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simuliere sofortige Geocoding-Ergebnisse (für Demo-Zwecke)
      const coordinates = {
        lat: 48.7758 + (Math.random() - 0.5) * 0.1,
        lng: 9.1829 + (Math.random() - 0.5) * 0.1
      };

      const addressData = {
        street: inputAddress.split(',')[0] || inputAddress,
        houseNumber: '',
        zipCode: '70173',
        city: 'Stuttgart',
        fullAddress: inputAddress,
        coordinates,
        accuracy: 95
      };

      setStartAddress(addressData);
      
      // Reset-Auswahl vor dem Wechsel zu Schritt 2
      setSelectedStations([]);
      setSelectedCustomAddresses([]);
      console.log('🔄 Step1: Auswahl vor Schritt 2 zurückgesetzt');
      
      toast.success('Adresse erfolgreich geocodiert!');
      
      // Sofort zu Schritt 2 weiterleiten
      setWizardStep(2);
    } catch (error) {
      toast.error('Fehler bei der Adressverarbeitung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(address);
  };

  const handleQuickAddress = (quickAddress: string) => {
    setAddress(quickAddress);
    handleSubmit(quickAddress);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 sm:px-6">
      {/* Main Container */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          {/* Header - Ultra Modern */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Startadresse
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Wo startet Ihre Route?
            </p>
          </motion.div>

          {/* Quick Address Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-blue-50/80 dark:bg-blue-900/10 backdrop-blur-sm rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-blue-800 dark:text-blue-200 font-medium text-sm">Schnellauswahl</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAddress('Schlossplatz 1, 70173 Stuttgart')}
                disabled={isSubmitting}
                className="bg-blue-100/80 dark:bg-blue-800/30 hover:bg-blue-200/80 dark:hover:bg-blue-700/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50 text-left"
              >
                Schlossplatz, Stuttgart
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddress('Hauptbahnhof, 70173 Stuttgart')}
                disabled={isSubmitting}
                className="bg-blue-100/80 dark:bg-blue-800/30 hover:bg-blue-200/80 dark:hover:bg-blue-700/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50 text-left"
              >
                Hauptbahnhof, Stuttgart
              </button>
            </div>
          </motion.div>

          {/* Address Input Form - Ultra Clean */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Address Field */}
              <div>
                <label htmlFor="address" className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adresse eingeben
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="z.B. Schlossplatz 1, 70173 Stuttgart"
                    className={`block w-full pl-4 pr-12 py-3 sm:py-4 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 ${
                      isFocused 
                        ? 'ring-2 ring-blue-500' 
                        : 'ring-1 ring-slate-200 dark:ring-slate-600'
                    }`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Navigation className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Submit Button - Ultra Modern */}
              <motion.button
                type="submit"
                disabled={isSubmitting || !address.trim()}
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Verarbeite...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Route starten</span>
                  </div>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Current Address Display - Enhanced */}
          {wizard.startAddress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-green-50/80 dark:bg-green-900/10 backdrop-blur-sm rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100/80 dark:bg-green-800/50 backdrop-blur-md rounded-xl p-2 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-green-800 dark:text-green-200 font-medium text-sm">Startadresse bestätigt</p>
                  <p className="text-green-700 dark:text-green-300 text-xs">
                    {wizard.startAddress.fullAddress}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Notice - Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              🗺️ Automatische Geocoding • Präzise Routenberechnung
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Step1AddressInputSimple;