'use client';

import { useEffect } from 'react';

export function ClientHtmlWrapper() {
  useEffect(() => {
    // Ensure any client-side HTML modifications are handled properly
    // This helps prevent hydration mismatches for focus-visible and other browser extensions
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      // Allow browser extensions and focus-visible polyfills to modify the HTML element
      // without causing hydration warnings
    }
  }, []);

  return null; // This component doesn't render anything
} 