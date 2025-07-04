"use client";

import { useEffect } from 'react';
import { useAccessibilityInit, useLiveRegion } from '@/hooks/useAccessibility';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes accessibility features for the entire app
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  useAccessibilityInit();
  useLiveRegion();

  useEffect(() => {
    // Add CSS classes for better focus management
    document.body.classList.add('accessibility-enhanced');
    
    return () => {
      document.body.classList.remove('accessibility-enhanced');
    };
  }, []);

  return <>{children}</>;
}
