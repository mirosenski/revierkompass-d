import React, { useState, useEffect } from 'react'
import { X, MapPin } from 'lucide-react'
import { AddressModalProps } from './types'

const AddressModal: React.FC<AddressModalProps> = ({ 
  address, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false,
  error = null,
  availablePraesidien = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    zipCode: '',
    city: '',
    coordinates: [0, 0] as [number, number],
    isVerified: false,
    isActive: true,
    reviewStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    parentId: '' as string,
    addressType: 'permanent' as 'temporary' | 'permanent',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (address && isOpen) {
      setFormData({
        name: address.name || '',
        street: address.street || '',
        zipCode: address.zipCode || '',
        city: address.city || '',
        coordinates: address.coordinates || [0, 0],
        isVerified: address.isVerified || false,
        isActive: address.isActive !== false,
        reviewStatus: address.reviewStatus || 'pending',
        parentId: (address as any).parentId || '',
        addressType: address.addressType || 'permanent',
      })
    } else if (!address && isOpen) {
      setFormData({
        name: '',
        street: '',
        zipCode: '',
        city: '',
        coordinates: [0, 0],
        isVerified: false,
        isActive: true,
        reviewStatus: 'pending',
        parentId: '',
        addressType: 'permanent',
      })
    }
  }, [address, isOpen])

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Name ist erforderlich'
    if (!formData.street) newErrors.street = 'Straße ist erforderlich'
    if (!formData.zipCode) newErrors.zipCode = 'PLZ ist erforderlich'
    if (!formData.city) newErrors.city = 'Stadt ist erforderlich'
    if (!formData.coordinates[0] || !formData.coordinates[1]) 
      newErrors.coordinates = 'Koordinaten sind erforderlich'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {address ? 'Adresse bearbeiten' : 'Neue Adresse erstellen'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Straße *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.street ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stadt *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Koordinaten *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Breitengrad"
                    value={formData.coordinates[0]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      coordinates: [Number(e.target.value), prev.coordinates[1]] 
                    }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.coordinates ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Längengrad"
                    value={formData.coordinates[1]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      coordinates: [prev.coordinates[0], Number(e.target.value)] 
                    }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.coordinates ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  />
                </div>
                {errors.coordinates && <p className="text-red-500 text-xs mt-1">{errors.coordinates}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.reviewStatus}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reviewStatus: e.target.value as 'pending' | 'approved' | 'rejected'
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option key="pending" value="pending">Ausstehend</option>
                  <option key="approved" value="approved">Genehmigt</option>
                  <option key="rejected" value="rejected">Abgelehnt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adress-Typ
                </label>
                <select
                  value={formData.addressType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    addressType: e.target.value as 'temporary' | 'permanent'
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option key="temporary" value="temporary">Temporär</option>
                  <option key="permanent" value="permanent">Permanent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Präsidium (optional)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option key="no-parent" value="">Kein Präsidium zugeordnet</option>
                  {availablePraesidien.map((praesidium) => (
                    <option key={praesidium.id} value={praesidium.id}>
                      {praesidium.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span>Verifiziert</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span>Aktiv</span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressModal 