import React from 'react';
import Logo from '@/components/ui/Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Logo size="sm" showText={true} animated={true} />
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
            Professionelle Routing-Anwendung für die Polizei Baden-Württemberg. 
            Entwickelt für präzise Navigation und effiziente Einsatzplanung.
          </p>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              © 2025 Polizei Baden-Württemberg. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              RevierKompass - Entwickelt mit ❤️ für die Polizei BW
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;