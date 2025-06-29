import React, { useState } from 'react'
import { Building2, MapPin, Settings, BarChart3, Database } from 'lucide-react'
import { AdminStationManagement } from './stations'
import { AdminAddressManagement } from './addresses'
import AddressImporter from './AddressImporter'

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stations')

  const tabs = [
    {
      id: 'stations',
      label: 'Stationen',
      icon: Building2,
      description: 'Polizeipräsidien und Reviere verwalten'
    },
    {
      id: 'addresses',
      label: 'Adressen',
      icon: MapPin,
      description: 'Benutzer-Adressen verwalten und genehmigen'
    },
    {
      id: 'import',
      label: 'Import',
      icon: Database,
      description: 'Adressen aus Daten-Dateien importieren'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Statistiken und Berichte'
    },
    {
      id: 'settings',
      label: 'Einstellungen',
      icon: Settings,
      description: 'System-Einstellungen'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stations':
        return <AdminStationManagement />
      case 'addresses':
        return <AdminAddressManagement />
      case 'import':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AddressImporter />
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Analytics & Berichte
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Analytics-Funktionen werden in Kürze verfügbar sein.
                </p>
              </div>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  System-Einstellungen
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  System-Einstellungen werden in Kürze verfügbar sein.
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return <AdminStationManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 py-6 px-4 font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default AdminDashboard
