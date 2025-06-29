import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/lib/store/app-store';
import { useAuthStore } from '@/lib/store/auth-store';
import Header from '@/components/layout/Header';
import EnhancedBreadcrumbs from '@/components/layout/EnhancedBreadcrumbs';
import Footer from '@/components/layout/Footer';
import WizardContainer from '@/components/wizard/WizardContainer';
import LoginForm from '@/components/auth/LoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TestImport from '@/pages/TestImport';

function App() {
  const [currentView, setCurrentView] = useState<'wizard' | 'login' | 'admin' | 'test'>('wizard');
  const { isDarkMode, setWizardStep } = useAppStore();
  const { isAuthenticated, isAdmin } = useAuthStore();

  // Beim Start der Anwendung immer zum Wizard mit Schritt 1 (Adressen-Startseite) navigieren
  useEffect(() => {
    // Prüfe URL für Test-Seite
    if (window.location.hash === '#test') {
      setCurrentView('test');
      console.log('🚀 Test-Seite aktiviert via URL');
    } else {
      setCurrentView('wizard');
      setWizardStep(1);
      console.log('🚀 RevierKompass gestartet - Adressen-Startseite aktiviert');
    }
  }, [setWizardStep]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Automatisch zum Admin-Dashboard wechseln wenn eingeloggt
  useEffect(() => {
    if (isAuthenticated && isAdmin && currentView === 'login') {
      setCurrentView('admin');
    }
  }, [isAuthenticated, isAdmin, currentView]);

  const handleAdminLogin = () => {
    setCurrentView('login');
  };

  const handleBackToWizard = () => {
    console.log('🔄 handleBackToWizard aufgerufen');
    setCurrentView('wizard');
    
    try {
      // Reset Wizard komplett zurück zu Schritt 1 und alle Auswahlen löschen
      const { resetWizard, setWizardStep } = useAppStore.getState();
      console.log('🔄 useAppStore resetWizard aufgerufen');
      resetWizard();
      setWizardStep(1);
      
      // Auch useWizardStore zurücksetzen falls verfügbar
      try {
        const { resetWizard: resetWizardStore } = require('@/store/useWizardStore').useWizardStore.getState();
        console.log('🔄 useWizardStore resetWizard aufgerufen');
        resetWizardStore();
      } catch (error) {
        console.log('⚠️ useWizardStore nicht verfügbar:', error);
      }
      
      console.log('✅ App: Wizard komplett zurückgesetzt - alle Steps und Auswahlen gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Zurücksetzen des Wizards:', error);
    }
  };

  const handleLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleGoToAdmin = () => {
    console.log('handleGoToAdmin aufgerufen, aktueller View:', currentView);
    if (isAuthenticated && isAdmin) {
      console.log('Navigation zu Admin-Dashboard');
      setCurrentView('admin');
    } else {
      console.log('Nicht authentifiziert - Navigation zu Login');
      setCurrentView('login');
    }
  };

  const handleBreadcrumbNavigation = (view: 'wizard' | 'login' | 'admin' | 'test', step?: number) => {
    console.log('Breadcrumb Navigation:', view, step);
    setCurrentView(view);
    
    // Wenn Wizard-Schritt spezifiziert, zum entsprechenden Schritt navigieren
    if (view === 'wizard' && step !== undefined) {
      // Hier könnte zusätzliche Logik für Wizard-Schritt-Navigation hinzugefügt werden
      // Für jetzt setzen wir nur den View
      const { setWizardStep } = useAppStore.getState();
      setWizardStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10 transition-colors duration-500">
      <Header 
        onAdminLogin={handleAdminLogin}
        onBackToWizard={handleBackToWizard}
        onGoToAdmin={handleGoToAdmin}
        currentView={currentView}
      />
      
      <EnhancedBreadcrumbs 
        currentView={currentView} 
        onNavigate={handleBreadcrumbNavigation}
      />
      
      <main className="flex-1">
        {currentView === 'wizard' && <WizardContainer />}
        {currentView === 'login' && <LoginForm onSuccess={handleLoginSuccess} />}
        {currentView === 'admin' && isAuthenticated && <AdminDashboard />}
        {currentView === 'test' && <TestImport />}
      </main>
      
      <Footer />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(12px)',
            maxWidth: '400px'
          }
        }}
      />
    </div>
  );
}

export default App;