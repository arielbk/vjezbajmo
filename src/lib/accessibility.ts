/**
 * Accessibility utilities for keyboard navigation and focus management
 */

/**
 * Moves focus to the next focusable element
 */
export function focusNext(): void {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = (currentIndex + 1) % focusableElements.length;
  focusableElements[nextIndex]?.focus();
}

/**
 * Moves focus to the previous focusable element
 */
export function focusPrevious(): void {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
  const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
  focusableElements[prevIndex]?.focus();
}

/**
 * Gets all focusable elements in the document
 */
export function getFocusableElements(): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(document.querySelectorAll(selector)).filter(
    (element) => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetParent !== null && // Not hidden
        !htmlElement.hasAttribute('aria-hidden') &&
        htmlElement.tabIndex !== -1
      );
    }
  ) as HTMLElement[];
}

/**
 * Traps focus within a specific element (useful for modals)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll([
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    } else if (event.key === 'Escape') {
      // Close modal or return focus
      element.dispatchEvent(new CustomEvent('escape-key'));
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Manages focus when navigating between pages
 */
export function manageFocusOnPageChange(): void {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus();
    announceToScreenReader('Page loaded');
  }
}

/**
 * Enhances form validation with screen reader announcements
 */
export function announceFormErrors(errors: Array<{ field: string; message: string }>): void {
  if (errors.length === 0) return;

  const errorCount = errors.length;
  const message = errorCount === 1 
    ? `1 error found: ${errors[0].message}`
    : `${errorCount} errors found. Please review the form.`;

  announceToScreenReader(message, 'assertive');

  // Focus the first field with an error
  const firstErrorField = document.getElementById(errors[0].field);
  if (firstErrorField) {
    firstErrorField.focus();
  }
}

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Adds high contrast mode support
 */
export function initializeHighContrastMode(): void {
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  
  const updateContrastMode = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Set initial state
  updateContrastMode(mediaQuery);
  
  // Listen for changes
  mediaQuery.addEventListener('change', updateContrastMode);
}

/**
 * Keyboard shortcut handler for exercise navigation
 */
export function initializeKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    // Only handle shortcuts when not in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Alt/Option + specific keys for navigation
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      switch (event.key) {
        case 'h':
          // Go to home
          event.preventDefault();
          window.location.href = '/';
          break;
        case 's':
          // Open settings
          event.preventDefault();
          const settingsButton = document.querySelector('[aria-label*="settings"]') as HTMLElement;
          settingsButton?.click();
          break;
        case 'r':
          // Restart current exercise (if available)
          event.preventDefault();
          const restartButton = document.querySelector('button:has-text("Try Again")') as HTMLElement;
          restartButton?.click();
          break;
      }
    }
  });
}

/**
 * Initialize all accessibility features
 */
export function initializeAccessibility(): void {
  initializeHighContrastMode();
  initializeKeyboardShortcuts();
  
  // Add focus-visible polyfill behavior for older browsers
  document.addEventListener('keydown', () => {
    document.body.classList.add('using-keyboard');
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('using-keyboard');
  });
}
