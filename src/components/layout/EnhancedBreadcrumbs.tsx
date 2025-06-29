import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, Settings, LogIn, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface BreadcrumbsProps {
  currentView: 'wizard' | 'login' | 'admin' | 'test';
  onNavigate?: (view: 'wizard' | 'login' | 'admin' | 'test', step?: number) => void;
}

interface BreadcrumbItem {
  label: string;
  icon?: React.ComponentType<any>;
  active: boolean;
  clickable: boolean;
  view?: 'wizard' | 'login' | 'admin' | 'test';
  step?: number;
  mobile?: boolean; // Für Mobile-optimierte Darstellung
}

const EnhancedBreadcrumbs: React.FC<BreadcrumbsProps> = ({ currentView, onNavigate }) => {
  const { wizard } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    if (currentView === 'wizard') {
      // Direkt mit Wizard-Schritten beginnen
      items.push({ 
        label: 'Adresse', 
        icon: Home, 
        active: wizard.currentStep === 1,
        clickable: wizard.currentStep > 1,
        view: 'wizard',
        step: 1
      });
      
      if (wizard.currentStep >= 2) {
        items.push({ 
          label: 'Ziele', 
          icon: undefined, 
          active: wizard.currentStep === 2,
          clickable: wizard.currentStep > 2,
          view: 'wizard',
          step: 2
        });
      }
      if (wizard.currentStep >= 3) {
        items.push({ 
          label: 'Export', 
          icon: undefined, 
          active: wizard.currentStep === 3,
          clickable: false, // Aktueller Schritt nicht klickbar
          view: 'wizard',
          step: 3
        });
      }
    } else if (currentView === 'login') {
      items.push({ 
        label: 'RevierKompass', 
        icon: Home, 
        active: false,
        clickable: true,
        view: 'wizard',
        step: 1
      });
      items.push({ 
        label: 'Anmeldung', 
        icon: LogIn, 
        active: true,
        clickable: false
      });
    } else if (currentView === 'admin') {
      if (isAuthenticated) {
        items.push({ 
          label: 'RevierKompass', 
          icon: Home, 
          active: false,
          clickable: true,
          view: 'wizard',
          step: 1
        });
        items.push({ 
          label: 'Admin', 
          icon: Settings, 
          active: true,
          clickable: false
        });
      }
    } else if (currentView === 'test') {
      items.push({ 
        label: 'RevierKompass', 
        icon: Home, 
        active: false,
        clickable: true,
        view: 'wizard',
        step: 1
      });
      items.push({ 
        label: 'Test Import', 
        icon: undefined, 
        active: true,
        clickable: false
      });
    }

    return items;
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (!item.clickable || !onNavigate) return;
    
    console.log('🔄 Breadcrumb geklickt:', item.label, item.step);
    
    if (item.view && item.step !== undefined) {
      // Wenn auf "Adresse" (Home) geklickt wird, Wizard komplett zurücksetzen
      if (item.step === 1) {
        console.log('🔄 Breadcrumb: Klick auf Adresse - Wizard wird komplett zurückgesetzt');
        try {
          // Beide Stores zurücksetzen
          const { resetWizard } = require('@/lib/store/app-store').useAppStore.getState();
          console.log('🔄 useAppStore resetWizard aufgerufen');
          resetWizard();
          
          try {
            const { resetWizard: resetWizardStore } = require('@/store/useWizardStore').useWizardStore.getState();
            console.log('🔄 useWizardStore resetWizard aufgerufen');
            resetWizardStore();
          } catch (error) {
            console.log('⚠️ useWizardStore nicht verfügbar:', error);
          }
          
          console.log('✅ Breadcrumb: Wizard erfolgreich zurückgesetzt');
        } catch (error) {
          console.error('❌ Fehler beim Zurücksetzen des Wizards:', error);
        }
      }
      onNavigate(item.view, item.step);
    } else if (item.view) {
      onNavigate(item.view);
    }
  };

  const breadcrumbs = getBreadcrumbs();

  // Mobile-optimierte Breadcrumbs (zeigt nur relevante Schritte)
  const mobileBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs.length <= 3) return breadcrumbs;
    
    const first = breadcrumbs[0];
    const current = breadcrumbs.find(item => item.active);
    const previous = breadcrumbs[breadcrumbs.findIndex(item => item.active) - 1];
    
    const mobileItems = [first];
    if (previous && previous !== first) {
      mobileItems.push({
        label: '...',
        icon: MoreHorizontal,
        active: false,
        clickable: false,
        mobile: true
      });
    }
    if (current && current !== first) {
      mobileItems.push(current);
    }
    
    return mobileItems;
  }, [breadcrumbs]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center space-x-2 py-3 text-sm">
          {breadcrumbs.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <React.Fragment key={index}>
                <motion.div 
                  whileHover={item.clickable ? { scale: 1.05 } : {}}
                  whileTap={item.clickable ? { scale: 0.95 } : {}}
                  onClick={() => handleBreadcrumbClick(item)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    item.active 
                      ? 'text-blue-600 dark:text-blue-400 font-medium' 
                      : item.clickable
                        ? 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer'
                        : 'text-gray-500 dark:text-gray-400'
                  } ${item.clickable ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg' : ''}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </motion.div>
                
                {!isLast && (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Breadcrumbs */}
        <div className="md:hidden flex items-center justify-between py-3">
          <div className="flex items-center space-x-2 text-sm">
            {mobileBreadcrumbs.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === mobileBreadcrumbs.length - 1;
              
              return (
                <React.Fragment key={index}>
                  <motion.div 
                    whileHover={item.clickable ? { scale: 1.05 } : {}}
                    whileTap={item.clickable ? { scale: 0.95 } : {}}
                    onClick={() => handleBreadcrumbClick(item)}
                    className={`flex items-center space-x-1 transition-all duration-200 ${
                      item.active 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : item.clickable
                          ? 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer'
                          : 'text-gray-500 dark:text-gray-400'
                    } ${item.clickable ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-1 rounded' : ''}`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    <span className="text-xs">{item.label}</span>
                  </motion.div>
                  
                  {!isLast && !item.mobile && (
                    <ChevronRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Back Button */}
          {currentView !== 'wizard' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('wizard')}
              className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Zurück</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedBreadcrumbs;
