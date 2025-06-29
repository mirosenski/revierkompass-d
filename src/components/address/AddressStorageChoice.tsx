import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Shield, Info, Check } from 'lucide-react';

interface AddressStorageChoiceProps {
  onStorageTypeSelect: (type: 'temporary' | 'permanent') => void;
  selectedType?: 'temporary' | 'permanent';
}

const AddressStorageChoice: React.FC<AddressStorageChoiceProps> = ({
  onStorageTypeSelect,
  selectedType
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const storageOptions = [
    {
      type: 'temporary' as const,
      title: 'Temporäre Speicherung',
      subtitle: 'Nur für diese Sitzung',
      description: 'Die Adresse wird nur lokal in Ihrem Browser gespeichert und automatisch gelöscht, wenn Sie die Seite verlassen.',
      icon: Clock,
      color: 'blue',
      benefits: [
        'Keine Registrierung erforderlich',
        'Völlig anonym',
        'Automatische Löschung',
        'Sofort verfügbar'
      ]
    },
    {
      type: 'permanent' as const,
      title: 'Permanente Speicherung',
      subtitle: 'Zur Überprüfung einreichen',
      description: 'Die Adresse wird anonymisiert an Administratoren zur Überprüfung gesendet und nach Genehmigung dauerhaft verfügbar.',
      icon: Save,
      color: 'green',
      benefits: [
        'Für alle Nutzer verfügbar',
        'Qualitätsprüfung durch Admins',
        'Dauerhafte Verfügbarkeit',
        'Trägt zur Verbesserung bei'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Speicher-Option wählen
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Wie möchten Sie diese Adresse speichern?
        </p>
      </div>

      {/* Storage Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storageOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          
          return (
            <motion.div
              key={option.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStorageTypeSelect(option.type)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? option.color === 'blue'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                    option.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                option.color === 'blue'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                <Icon className={`h-6 w-6 ${
                  option.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {option.title}
                  </h4>
                  <p className={`text-sm font-medium ${
                    option.color === 'blue'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {option.subtitle}
                  </p>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {option.description}
                </p>

                {/* Benefits */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    Vorteile:
                  </h5>
                  <ul className="space-y-1">
                    {option.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          option.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: showInfo ? 1 : 0, 
          height: showInfo ? 'auto' : 0 
        }}
        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h5 className="font-medium text-gray-900 dark:text-white">
              Datenschutz & Sicherheit
            </h5>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>
                <strong>Temporäre Speicherung:</strong> Daten verbleiben ausschließlich in Ihrem Browser 
                und werden nicht an externe Server übertragen.
              </p>
              <p>
                <strong>Permanente Speicherung:</strong> Nur die Adressdaten (Name, Straße, PLZ, Stadt) 
                werden anonymisiert übertragen. Keine persönlichen Daten oder IP-Adressen werden gespeichert.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toggle Info Button */}
      <div className="text-center">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          <Info className="h-4 w-4" />
          <span>{showInfo ? 'Weniger' : 'Mehr'} Informationen</span>
        </button>
      </div>
    </div>
  );
};

export default AddressStorageChoice;
