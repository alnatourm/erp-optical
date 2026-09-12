import React from 'react';

/**
 * Enables Enter key navigation between input fields across form elements.
 * Pressing Enter on an input or select moves focus to the next field instead of submitting prematurely.
 */
export function handleEnterKeyNavigation(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'SELECT') &&
      target.getAttribute('type') !== 'submit' &&
      target.getAttribute('type') !== 'button'
    ) {
      e.preventDefault();
      const form = target.closest('form') || target.closest('.form-container') || document.body;
      const focusables = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]'
        )
      );
      const currentIndex = focusables.indexOf(target);
      if (currentIndex > -1 && currentIndex < focusables.length - 1) {
        focusables[currentIndex + 1].focus();
      }
    }
  }
}
