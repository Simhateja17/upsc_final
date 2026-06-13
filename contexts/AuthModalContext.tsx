'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ModalTab = 'signup' | 'login';

interface AuthModalContextType {
  isOpen: boolean;
  defaultTab: ModalTab;
  openAuthModal: (tab?: ModalTab) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<ModalTab>('signup');

  const openAuthModal = useCallback((tab: ModalTab = 'signup') => {
    setDefaultTab(tab);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, defaultTab, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
