import React from 'react';
import { AlertTriangle } from 'lucide-react';

const NoSelectionWarning: React.FC = () => (
  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p>Keine Ziele ausgewählt.</p>
    <p className="text-sm">Bitte wählen Sie Stationen oder Adressen in Schritt 2 aus.</p>
  </div>
);

export default NoSelectionWarning;
