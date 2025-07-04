import { useEffect } from 'react';
import { 
  manageFocusOnPageChange, 
  announceToScreenReader,
  initializeAccessibility 
} from '@/lib/accessibility';

/**
 * Hook for managing focus when components mount or unmount
 */
export function useFocusManagement(shouldFocus: boolean = true) {
  useEffect(() => {
    if (shouldFocus) {
      manageFocusOnPageChange();
    }
  }, [shouldFocus]);
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  return {
    announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceToScreenReader(message, priority);
    }
  };
}

/**
 * Hook for initializing accessibility features on app mount
 */
export function useAccessibilityInit() {
  useEffect(() => {
    initializeAccessibility();
  }, []);
}

/**
 * Hook for managing live regions for dynamic content
 */
export function useLiveRegion() {
  useEffect(() => {
    // Create live region if it doesn't exist
    if (!document.getElementById('live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  }, []);

  const updateLiveRegion = (message: string) => {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  };

  return { updateLiveRegion };
}

/**
 * Hook for keyboard navigation in lists or grids
 */
export function useKeyboardNavigation(
  itemsRef: React.RefObject<HTMLElement[]>,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!itemsRef.current) return;

      const items = itemsRef.current.filter(item => item && !item.hasAttribute('disabled'));
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentIndex && items[nextIndex]) {
        items[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [itemsRef, loop, orientation]);
}
