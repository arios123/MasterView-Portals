/**
 * Current terms version - update this when terms change
 */
export const CURRENT_TERMS_VERSION = 'v1';

/**
 * Load terms and conditions content from file
 * In Vite, we need to import the file directly or fetch from public directory
 * In demo mode, loads from demo.txt instead of terms_v1.txt
 */
export const loadTermsContent = async (): Promise<string> => {
  try {
    // Check if we're in demo mode
    const isDemo = import.meta.env.VITE_APP_MODE === "demo" || 
                   (typeof window !== "undefined" && window.location.hostname.startsWith("demo."));
    
    // In demo mode, load from demo.txt
    if (isDemo) {
      const response = await fetch('/demo.txt');
      if (response.ok) {
        const text = await response.text();
        // Return the text even if empty, or a default message if file is empty
        return text.trim() || 'This is a Demo only, no changes will be saved.';
      }
      // If fetch fails, throw error to fall through to catch block
      throw new Error('Failed to fetch demo.txt');
    }
    
    // Production mode: Try to fetch from public directory first (recommended for Vite)
    const response = await fetch('/terms_v1.txt');
    
    if (response.ok) {
      return await response.text();
    }
    
    // Fallback: try src/content (for development)
    const fallbackResponse = await fetch('/src/content/terms_v1.txt');
    if (fallbackResponse.ok) {
      return await fallbackResponse.text();
    }
    
    throw new Error('Failed to load terms and conditions');
  } catch (error) {
    console.error('Error loading terms:', error);
    // Return a fallback message if file can't be loaded
    return 'Terms and conditions content could not be loaded. Please contact support.';
  }
};
