import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { toast } from 'react-hot-toast';

const Step1AddressInputSimple: React.FC = () => {
  const [address, setAddress] = useState('');
  const { setStartAddress, setWizardStep, setSelectedStations, setSelectedCustomAddresses, wizard } = useAppStore();

  const handleSubmit = (inputAddress: string) => {
    if (!inputAddress.trim()) {
      toast.error('Bitte geben Sie eine Adresse ein');
      return;
    }

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
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(address);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Startadresse eingeben
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Geben Sie Ihre Startadresse für die Routenberechnung ein
            </p>
          </div>
        </div>
      </motion.div>

      {/* Address Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Startadresse
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="z.B. Schlossplatz 1, 70173 Stuttgart"
              className="block w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <span>Adresse bestätigen</span>
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>
      </motion.div>

      {/* Current Address Display */}
      {wizard.startAddress && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Startadresse bestätigt
              </h3>
              <p className="text-green-700 dark:text-green-300">
                {wizard.startAddress.fullAddress}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Koordinaten: {wizard.startAddress.coordinates.lat.toFixed(6)}, {wizard.startAddress.coordinates.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Step1AddressInputSimple;