import { useEffect, useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchWorkspaceTheme, WorkspaceTheme } from '@/queries/workspaceThemes';

/**
 * Default theme values (matches index.css :root defaults)
 */
const DEFAULT_THEME = {
  primary_color: '0 0% 9%',
  secondary_color: '0 0% 96%',
  accent_color: '0 0% 15%',
  bg_color: '0 0% 100%',
  surface_color: '0 0% 100%',
  text_color: '215 25% 15%',
  muted_color: '215 15% 92%',
  border_color: '215 15% 88%',
};

/**
 * Apply theme CSS variables to the document root
 */
function applyTheme(theme: typeof DEFAULT_THEME) {
  const root = document.documentElement;
  
  // Map theme colors to CSS variables
  // primary → --primary
  root.style.setProperty('--primary', theme.primary_color);
  
  // secondary → --secondary
  root.style.setProperty('--secondary', theme.secondary_color);
  
  // accent → --accent
  root.style.setProperty('--accent', theme.accent_color);
  
  // bg → --background
  root.style.setProperty('--background', theme.bg_color);
  
  // surface → --card (cards use bg-card which maps to --card)
  root.style.setProperty('--card', theme.surface_color);
  
  // text → --foreground
  root.style.setProperty('--foreground', theme.text_color);
  
  // muted → --muted
  root.style.setProperty('--muted', theme.muted_color);
  
  // border → --border
  root.style.setProperty('--border', theme.border_color);
  
  // Also update input (usually same as border)
  root.style.setProperty('--input', theme.border_color);
  
  // Apply sidebar colors using theme colors
  // Sidebar background uses surface_color (cards/surfaces)
  root.style.setProperty('--sidebar-background', theme.surface_color);
  // Sidebar foreground uses text_color
  root.style.setProperty('--sidebar-foreground', theme.text_color);
  // Sidebar primary uses primary_color
  root.style.setProperty('--sidebar-primary', theme.primary_color);
  // Sidebar primary foreground uses primary-foreground (we'll calculate contrast)
  root.style.setProperty('--sidebar-primary-foreground', theme.primary_color === '0 0% 9%' ? '0 0% 100%' : theme.text_color);
  // Sidebar accent uses muted_color
  root.style.setProperty('--sidebar-accent', theme.muted_color);
  // Sidebar accent foreground uses text_color
  root.style.setProperty('--sidebar-accent-foreground', theme.text_color);
  // Sidebar border uses border_color
  root.style.setProperty('--sidebar-border', theme.border_color);
  // Sidebar ring uses accent_color
  root.style.setProperty('--sidebar-ring', theme.accent_color);
  
  // Apply bg_color to html and body elements directly for page background
  // (These are hardcoded in index.css but we override them for theme customization)
  const bgColorHsl = `hsl(${theme.bg_color})`;
  root.style.backgroundColor = bgColorHsl;
  if (document.body) {
    document.body.style.backgroundColor = bgColorHsl;
  }
}

/**
 * Reset theme to defaults
 */
function resetTheme() {
  applyTheme(DEFAULT_THEME);
  // Reset html/body background to default (will be overridden by CSS or theme)
  const root = document.documentElement;
  root.style.backgroundColor = '';
  if (document.body) {
    document.body.style.backgroundColor = '';
  }
}

/**
 * Hook to fetch and apply workspace theme
 * Automatically applies theme CSS variables when workspace changes
 * Only applies theme when in portal (not on landing/auth pages)
 */
export function useWorkspaceTheme() {
  const { currentWorkspace } = useWorkspace();
  const [theme, setTheme] = useState<WorkspaceTheme | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.id) {
      // No workspace, reset to defaults
      resetTheme();
      setTheme(null);
      return;
    }

    // Fetch theme for current workspace
    setLoading(true);
    fetchWorkspaceTheme(currentWorkspace.id)
      .then((fetchedTheme) => {
        if (fetchedTheme) {
          setTheme(fetchedTheme);
          // Apply theme
          applyTheme({
            primary_color: fetchedTheme.primary_color,
            secondary_color: fetchedTheme.secondary_color,
            accent_color: fetchedTheme.accent_color,
            bg_color: fetchedTheme.bg_color,
            surface_color: fetchedTheme.surface_color,
            text_color: fetchedTheme.text_color,
            muted_color: fetchedTheme.muted_color,
            border_color: fetchedTheme.border_color,
          });
        } else {
          // No theme found, use defaults
          setTheme(null);
          resetTheme();
          // Apply default theme colors (which will also set the background)
          applyTheme(DEFAULT_THEME);
        }
      })
      .catch((error) => {
        console.error('Error fetching workspace theme:', error);
        // On error, use defaults
        setTheme(null);
        resetTheme();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentWorkspace?.id]);

  return { theme, loading };
}

