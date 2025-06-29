import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, MapPin, AlertTriangle, Database, Edit2, Trash2, CheckCircle, XCircle, Clock, BarChart3, Building2, Users, Clock3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminStore } from '@/lib/store/admin-store'
import adminAddressService, { Address, CreateAddressData, UpdateAddressData } from '@/services/api/admin-address.service'
import { createAllAalenAddresses } from '@/data/aalen-addresses'
import { AddressFilterState } from './types'
import AddressCard from './AddressCard'
import AddressModal from './AddressModal'
import AddressFilters from './AddressFilters'
import { motion } from 'framer-motion'
import ConvertToStationModal from './ConvertToStationModal'

type AddressTab = 'station' | 'user' | 'temporary'

// ===== MAIN COMPONENT =====
const AdminAddressManagement: React.FC = () => {
  const { allStations } = useAdminStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AddressTab>('user')
  const [filters, setFilters] = useState<AddressFilterState>({
    search: '',
    city: '',
    status: 'all',
    showInactive: false
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [convertingAddress, setConvertingAddress] = useState<Address | null>(null)

  // Load addresses on mount
  useEffect(() => {
    loadAddresses()
    loadStats()
  }, [])

  // Filter addresses based on active tab and filters
  useEffect(() => {
    let filtered = addresses

    // Filter by address type based on active tab
    switch (activeTab) {
      case 'station':
        // Station addresses: addresses that are linked to stations or are verified
        filtered = filtered.filter(addr => 
          addr.parentId && addr.isVerified
        )
        break
      case 'user':
        // User addresses: permanent addresses that are not anonymous
        filtered = filtered.filter(addr => 
          !addr.isAnonymous && addr.addressType === 'permanent'
        )
        break
      case 'temporary':
        // Temporary addresses: temporary or anonymous addresses
        filtered = filtered.filter(addr => 
          addr.addressType === 'temporary' || addr.isAnonymous
        )
        break
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(addr =>
        addr.name.toLowerCase().includes(searchLower) ||
        addr.street.toLowerCase().includes(searchLower) ||
        addr.city.toLowerCase().includes(searchLower) ||
        addr.zipCode.toLowerCase().includes(searchLower)
      )
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(addr => addr.city === filters.city)
    }

    // Status filter (only for user addresses)
    if (activeTab === 'user' && filters.status !== 'all') {
      filtered = filtered.filter(addr => addr.reviewStatus === filters.status)
    }

    // Active/Inactive filter
    if (!filters.showInactive) {
      filtered = filtered.filter(addr => addr.isActive)
    }

    setFilteredAddresses(filtered)
  }, [addresses, filters, activeTab])

  const loadAddresses = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await adminAddressService.getAllAddresses()
      setAddresses(data)
    } catch (err) {
      console.error('Error loading addresses:', err)
      setError('Fehler beim Laden der Adressen')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/addresses/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const handleSave = async (formData: CreateAddressData | UpdateAddressData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (editingAddress) {
        await adminAddressService.updateAddress(editingAddress.id, formData as UpdateAddressData)
        toast.success('Adresse erfolgreich aktualisiert')
      } else {
        await adminAddressService.createAddress(formData as CreateAddressData)
        toast.success('Adresse erfolgreich erstellt')
      }
      
      await loadAddresses()
      handleCloseModal()
    } catch (err) {
      console.error('Error saving address:', err)
      setError('Fehler beim Speichern der Adresse')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const address = addresses.find(addr => addr.id === id)
    
    // Stationen-Adressen können nicht gelöscht werden
    if (address && (address.parentId && address.isVerified)) {
      toast.error('Stationen-Adressen können nicht gelöscht werden. Bearbeiten Sie diese über den Bereich "Stationen".')
      return
    }
    
    if (!confirm('Möchten Sie diese Adresse wirklich löschen?')) return

    try {
      await adminAddressService.deleteAddress(id)
      toast.success('Adresse erfolgreich gelöscht')
      await loadAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
      toast.error('Fehler beim Löschen der Adresse')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await adminAddressService.approveAddress(id)
      toast.success('Adresse genehmigt')
      await loadAddresses()
    } catch (err) {
      console.error('Error approving address:', err)
      toast.error('Fehler beim Genehmigen der Adresse')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await adminAddressService.rejectAddress(id)
      toast.success('Adresse abgelehnt')
      await loadAddresses()
    } catch (err) {
      console.error('Error rejecting address:', err)
      toast.error('Fehler beim Ablehnen der Adresse')
    }
  }

  // Convert address to station
  const handleConvertToStation = async (address: Address, stationData: any) => {
    try {
      setIsLoading(true)
      
      // Create new station from address data
      const stationPayload = {
        name: address.name,
        type: stationData.type,
        city: address.city,
        address: address.street,
        coordinates: address.coordinates,
        telefon: stationData.telefon,
        email: stationData.email,
        notdienst24h: stationData.notdienst24h,
        isActive: stationData.isActive,
        parentId: stationData.type === 'revier' ? stationData.parentId : undefined
      }

      // Create station via stations API
      const response = await fetch('/api/stationen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stationPayload)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Station')
      }

      const newStation = await response.json()

      // Delete the original address
      await adminAddressService.deleteAddress(address.id)

      toast.success(`Adresse erfolgreich zu Station "${newStation.name}" konvertiert`)
      await loadAddresses()
      
    } catch (err) {
      console.error('Error converting address to station:', err)
      toast.error('Fehler beim Konvertieren der Adresse')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle convert button click
  const handleConvertClick = (address: Address) => {
    setConvertingAddress(address)
    setIsConvertModalOpen(true)
  }

  // Handle filter changes
  const handleFilterChange = useCallback((field: keyof AddressFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      city: '',
      status: 'all',
      showInactive: false
    })
  }, [])

  // Handle address creation
  const handleCreateAddress = useCallback(() => {
    setEditingAddress(null)
    setIsModalOpen(true)
  }, [])

  // Handle address editing
  const handleEditAddress = useCallback((address: Address) => {
    setEditingAddress(address)
    setIsModalOpen(true)
  }, [])

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingAddress(null)
  }, [])

  // Get all cities for filter dropdown
  const allCities = useMemo(() => {
    const cities = new Set(addresses.map(addr => addr.city))
    return Array.from(cities).sort()
  }, [addresses])

  // Get available Präsidien for parent selection
  const availablePraesidien = useMemo(() => {
    return allStations.filter(s => s.type === 'praesidium' && s.isActive)
  }, [allStations])

  // Handle create all Aalen addresses
  const handleCreateAllAalenAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const createdCount = await createAllAalenAddresses();
      if (createdCount > 0) {
        await loadAddresses(); // Reload addresses after creation
      }
    } catch (error) {
      console.error('Error creating Aalen addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAddresses]);

  // Checkbox-Logik
  const isAllSelected = filteredAddresses.length > 0 && filteredAddresses.every(addr => selectedIds.includes(addr.id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleCheck = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sel => sel !== id))
  }

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAddresses.map(addr => addr.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    
    // Filtere Stationen-Adressen aus der Auswahl
    const deletableIds = selectedIds.filter(id => {
      const address = addresses.find(addr => addr.id === id)
      return !address || !(address.parentId && address.isVerified)
    })
    
    const nonDeletableCount = selectedIds.length - deletableIds.length
    
    if (deletableIds.length === 0) {
      toast.error('Keine löschbaren Adressen ausgewählt. Stationen-Adressen können nicht gelöscht werden.')
      return
    }
    
    let confirmMessage = `Möchten Sie wirklich ${deletableIds.length} Adressen unwiderruflich löschen?`
    if (nonDeletableCount > 0) {
      confirmMessage += `\n\n${nonDeletableCount} Stationen-Adressen wurden von der Löschung ausgeschlossen.`
    }
    
    if (!confirm(confirmMessage)) return
    
    try {
      for (const id of deletableIds) {
        await adminAddressService.deleteAddress(id)
      }
      toast.success(`${deletableIds.length} Adressen gelöscht`)
      if (nonDeletableCount > 0) {
        toast.error(`${nonDeletableCount} Stationen-Adressen wurden nicht gelöscht`)
      }
      setSelectedIds([])
      await loadAddresses()
    } catch (err) {
      toast.error('Fehler beim Massenlöschen')
    }
  }

  // Loading State
  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Adressen werden geladen...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Fehler beim Laden
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    )
  }

  const hasActiveFilters = Boolean(filters.search || filters.city || filters.status !== 'all')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Adressen verwalten
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredAddresses.length} von {addresses.length} Adressen
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showInactive}
                  onChange={(e) => handleFilterChange('showInactive', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span>Inaktive anzeigen</span>
              </label>
              
              <button
                onClick={handleCreateAddress}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Neue Adresse</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('user')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'user'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Nutzer-Adressen
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                  {addresses.filter(addr => !addr.isAnonymous && addr.addressType === 'permanent').length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('station')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'station'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Stationen-Adressen
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                  {addresses.filter(addr => addr.parentId && addr.isVerified).length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('temporary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'temporary'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Clock3 className="w-4 h-4" />
                Temporäre Adressen
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                  {addresses.filter(addr => addr.addressType === 'temporary' || addr.isAnonymous).length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        <AddressFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          allCities={allCities}
          hasActiveFilters={hasActiveFilters}
          filteredAddressesCount={filteredAddresses.length}
          activeTab={activeTab}
        />
      </div>

      {/* Address Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={el => { if (el) el.indeterminate = isSomeSelected }}
            onChange={e => handleCheckAll(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Alle auswählen</span>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow transition-colors"
            >
              {selectedIds.length === 1 ? 'Ausgewählte Adresse löschen' : `${selectedIds.length} Adressen löschen`}
            </button>
          )}
        </div>
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 w-20 h-20 mx-auto mb-4">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Adressen gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters 
                ? 'Versuchen Sie, die Filter anzupassen oder zu löschen.' 
                : 'Erstellen Sie Ihre erste Adresse.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Filter löschen
              </button>
            ) : (
              <button
                onClick={handleCreateAddress}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Erste Adresse erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAddresses.map((address) => (
              <div key={address.id} className="animate-in fade-in-50 duration-200">
                <AddressCard
                  address={address}
                  onEdit={handleEditAddress}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onConvertToStation={handleConvertClick}
                  checked={selectedIds.includes(address.id)}
                  onCheck={handleCheck}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AddressModal
        address={editingAddress}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        isLoading={isLoading}
        error={error}
        availablePraesidien={availablePraesidien}
      />

      {/* Convert to Station Modal */}
      <ConvertToStationModal
        address={convertingAddress}
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false)
          setConvertingAddress(null)
        }}
        onConvert={handleConvertToStation}
        availablePraesidien={availablePraesidien}
      />
    </div>
  )
}

export default AdminAddressManagement 