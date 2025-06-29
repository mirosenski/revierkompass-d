// utils/sessionManager.ts
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private static SESSION_KEY = 'revierkompass_session_id';
  private static SESSION_EXPIRY = 'revierkompass_session_expiry';
  private static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

  static getSessionId(): string {
    const existingId = localStorage.getItem(this.SESSION_KEY);
    const expiry = localStorage.getItem(this.SESSION_EXPIRY);

    // Prüfen ob Session noch gültig
    if (existingId && expiry && new Date().getTime() < parseInt(expiry)) {
      return existingId;
    }

    // Neue Session erstellen
    const newSessionId = uuidv4();
    const newExpiry = new Date().getTime() + this.SESSION_DURATION;
    
    localStorage.setItem(this.SESSION_KEY, newSessionId);
    localStorage.setItem(this.SESSION_EXPIRY, newExpiry.toString());
    
    return newSessionId;
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY);
  }

  static isSessionValid(): boolean {
    const expiry = localStorage.getItem(this.SESSION_EXPIRY);
    return expiry ? new Date().getTime() < parseInt(expiry) : false;
  }
}

// hooks/useSession.ts
import { useEffect, useState } from 'react';
import { SessionManager } from '../utils/sessionManager';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    setSessionId(SessionManager.getSessionId());
  }, []);

  return {
    sessionId,
    isValid: SessionManager.isSessionValid(),
    refresh: () => setSessionId(SessionManager.getSessionId()),
    clear: SessionManager.clearSession
  };
}