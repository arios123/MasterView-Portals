/**
 * Current terms version - update this when terms change
 */
export const CURRENT_TERMS_VERSION = 'v2';

/**
 * Load terms and conditions content from file
 * In Vite, we need to import the file directly or fetch from public directory
 */
export const loadTermsContent = async (): Promise<string> => {
  try {
    // Try to fetch from public directory first (recommended for Vite)
    const response = await fetch('/terms_v2.txt');
    
    if (response.ok) {
      return await response.text();
    }
    
    // Fallback: try src/content (for development)
    const fallbackResponse = await fetch('/src/content/terms_v2.txt');
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

