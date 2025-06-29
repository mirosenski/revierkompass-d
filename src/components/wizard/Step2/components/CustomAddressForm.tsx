import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Database, Building2 } from 'lucide-react';
import { FormData } from '../types';

interface CustomAddressFormProps {
  showAddForm: boolean;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onAddAddress: () => void;
  onCancel: () => void;
  availablePraesidien?: Array<{ id: string; name: string; city: string }>;
  editAddress?: any | null;
  onEditSubmit?: (data: FormData) => void;
  isEditing?: boolean;
}

const CustomAddressForm: React.FC<CustomAddressFormProps> = React.memo(({
  showAddForm,
  formData,
  setFormData,
  onAddAddress,
  onCancel,
  availablePraesidien = [],
  editAddress,
  onEditSubmit,
  isEditing
}) => {
  if (!showAddForm) return null;

  const handleSubmit = React.useCallback(() => {
    if (editAddress && onEditSubmit) {
      onEditSubmit(formData);
    } else {
      onAddAddress();
    }
  }, [editAddress, onEditSubmit, formData, onAddAddress]);

  const isEditMode = !!editAddress;

  // Setze Standard auf temporäre Adressen für bessere UX - nur beim ersten Rendern
  React.useEffect(() => {
    if (!isEditMode && formData.addressType === 'permanent') {
      setFormData({ ...formData, addressType: 'temporary' });
    }
  }, [isEditMode]); // Nur isEditMode als Abhängigkeit

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
    >
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {isEditMode ? 'Adresse bearbeiten' : 'Neue Adresse hinzufügen'}
      </h4>
      
      {/* Adress-Typ Auswahl - nur im Add-Modus */}
      {!isEditMode && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Adress-Typ *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <input
                type="radio"
                name="addressType"
                value="temporary"
                checked={formData.addressType === 'temporary'}
                onChange={(e) => setFormData({ ...formData, addressType: e.target.value as 'temporary' | 'permanent' })}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center ${
                formData.addressType === 'temporary' 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-gray-300 dark:border-gray-500'
              }`}>
                {formData.addressType === 'temporary' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Temporäre Adresse</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sofort verfügbar für Routenberechnung
                  </div>
                </div>
              </div>
            </label>

            <label className="relative flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-green-300 dark:hover:border-green-600 transition-colors">
              <input
                type="radio"
                name="addressType"
                value="permanent"
                checked={formData.addressType === 'permanent'}
                onChange={(e) => setFormData({ ...formData, addressType: e.target.value as 'temporary' | 'permanent' })}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center ${
                formData.addressType === 'permanent' 
                  ? 'border-green-600 bg-green-600' 
                  : 'border-gray-300 dark:border-gray-500'
              }`}>
                {formData.addressType === 'permanent' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Permanente Adresse</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Wird gespeichert und von Admins überprüft
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Adress-Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name/Bezeichnung *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. Büro, Zuhause, Kunde"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Straße *
          </label>
          <input
            type="text"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="z.B. Musterstraße 123"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PLZ *
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="z.B. 70173"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stadt *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="z.B. Stuttgart"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Präsidium-Auswahl für permanente Adressen */}
      {formData.addressType === 'permanent' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zugehöriges Präsidium (optional)
          </label>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Building2 className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <select
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option key="no-parent" value="">Kein Präsidium zugeordnet</option>
                {availablePraesidien.map((praesidium) => (
                  <option key={praesidium.id} value={praesidium.id}>
                    {praesidium.name} ({praesidium.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Wählen Sie ein Präsidium aus, falls die Adresse zu einem bestehenden Revier gehört
          </p>
        </div>
      )}

      {/* Info-Box */}
      <div className={`p-4 rounded-lg border-l-4 mb-4 ${
        formData.addressType === 'temporary' 
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400' 
          : 'bg-green-50 dark:bg-green-900/20 border-green-400'
      }`}>
        <div className="flex items-start space-x-3">
          {formData.addressType === 'temporary' ? (
            <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
          ) : (
            <Database className="h-5 w-5 text-green-500 mt-0.5" />
          )}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white">
              {isEditMode ? 'Adresse bearbeiten' : (formData.addressType === 'temporary' ? 'Temporäre Adresse' : 'Permanente Adresse')}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEditMode 
                ? 'Bearbeiten Sie die Adressdetails und speichern Sie die Änderungen.'
                : (formData.addressType === 'temporary' 
                    ? 'Diese Adresse wird sofort für die Routenberechnung verfügbar sein und kann in Step 3 verwendet werden.'
                    : 'Diese Adresse wird zur Überprüfung an Admins gesendet. Nach Genehmigung wird sie dauerhaft in der Datenbank gespeichert und steht allen Nutzern zur Verfügung.'
                  )
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          disabled={isEditing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          {isEditing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Speichern...</span>
            </>
          ) : (
            <>
              <span>{isEditMode ? 'Aktualisieren' : (formData.addressType === 'temporary' ? 'Sofort hinzufügen' : 'Zur Überprüfung einreichen')}</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isEditing}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isEditMode ? 'Abbrechen' : 'Abbrechen'}
        </button>
      </div>
    </motion.div>
  );
});

CustomAddressForm.displayName = 'CustomAddressForm';

export default CustomAddressForm; 