// Handle browser extension attributes after hydration
if (typeof window !== 'undefined') {
  // Wait for React to finish hydrating
  setTimeout(() => {
    // Remove or normalize any attributes added by browser extensions
    const body = document.body;
    if (body) {
      // These are common attributes added by Grammarly and other extensions
      const extensionAttributes = [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-new-gr-c-s-loaded',
        'data-gr-ext-disabled'
      ];
      
      extensionAttributes.forEach(attr => {
        if (body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });
    }
  }, 100);
}