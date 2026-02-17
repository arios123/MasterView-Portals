import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StaffManagement } from './admin/StaffManagement';
import { DocumentsSection } from './admin/DocumentsSection';
import { PricingSection } from './admin/PricingSection';
import { ClientLookbook } from './admin/ClientLookbook';
import { RolesPermissions } from './admin/RolesPermissions';
import { AdminAuditLog } from './admin/AdminAuditLog';
import { WorkspaceSetup } from './admin/WorkspaceSetup';
import { ExportData } from './admin/ExportData';
import { Advanced } from './admin/Advanced';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { useLocalStorageCache, useCacheKey } from '@/hooks/useLocalStorageCache';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/utils/demoMode';

type AdminTabConfig = {
  value: string;
  label: string;
  permission: string;
  component: React.ReactNode;
  row: 1 | 2; // Which row the tab should appear in
};

export function AdminTab() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const isUserActionRef = useRef(false);
  const navigationInProgressRef = useRef(false);
  const initializedRef = useRef(false);
  const lastNavigatedSectionRef = useRef<string | null>(null);
  const activeSectionRef = useRef<string>('');
  const userActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current user is workspace owner
  const isWorkspaceOwner = useMemo(() => {
    return currentWorkspace?.owner_id === user?.id;
  }, [currentWorkspace?.owner_id, user?.id]);

  // Define all admin tabs with row indicators
  // First 5 tabs go in row 1, rest go in row 2 (audit log is first in row 2)
  const allTabs: AdminTabConfig[] = useMemo(() => {
    const tabs: AdminTabConfig[] = [
      // Row 1 tabs (first 5)
      {
        value: 'staff',
        label: 'Staff',
        permission: 'tab.admin_staff.view',
        component: <StaffManagement />,
        row: 1
      },
      {
        value: 'documents',
        label: 'Documents',
        permission: 'tab.admin_documents.view',
        component: <DocumentsSection />,
        row: 1
      },
      {
        value: 'pricing',
        label: 'Pricing',
        permission: 'tab.admin_pricing.view',
        component: <PricingSection />,
        row: 1
      },
      {
        value: 'roles',
        label: 'Roles & Permissions',
        permission: 'tab.admin_rolesandpermissions.view',
        component: <RolesPermissions />,
        row: 1
      },
      {
        value: 'lookbook',
        label: 'LookBook',
        permission: 'tab.admin_lookbook.view',
        component: <ClientLookbook />,
        row: 1
      },
      // Row 2 tabs (audit log first, then future tabs)
      {
        value: 'auditlog',
        label: 'Audit Log',
        permission: 'tab.admin_auditlog.view',
        component: <AdminAuditLog />,
        row: 2
      },
      {
        value: 'workspacesetup',
        label: 'Workspace Setup',
        permission: 'tab.admin_workspacesetup.view',
        component: <WorkspaceSetup />,
        row: 2
      },
      {
        value: 'exportdata',
        label: 'Export Data',
        permission: 'tab.admin_exportdata.view',
        component: <ExportData />,
        row: 2
      },
    ];

    // Only add Advanced tab if not in demo mode
    if (!isDemoMode()) {
      tabs.push({
        value: 'advanced',
        label: 'Advanced',
        permission: 'tab.admin_advanced.view', // Special permission - owner check is done separately
        component: <Advanced />,
        row: 2
      });
    }

    // Future tabs can be added here (they'll automatically go to row 2)
    return tabs;
  }, []);

  // Filter tabs based on permissions (and owner check for Advanced tab)
  const availableTabs = useMemo(() => {
    return allTabs.filter(tab => {
      // Advanced tab requires owner check instead of permission check
      if (tab.value === 'advanced') {
        return isWorkspaceOwner;
      }
      // All other tabs use permission-based access
      return can(tab.permission);
    });
  }, [allTabs, can, isWorkspaceOwner]);

  // Separate tabs by row for rendering
  const row1Tabs = useMemo(() => {
    return availableTabs.filter(tab => tab.row === 1);
  }, [availableTabs]);

  const row2Tabs = useMemo(() => {
    return availableTabs.filter(tab => tab.row === 2);
  }, [availableTabs]);

  // Get the first available tab as default (first in the array, which is staff if available)
  // Never use "advanced" as the default - it should always be a secondary option
  const defaultSection = useMemo(() => {
    if (availableTabs.length === 0) return 'staff';
    // Find the first available tab that is NOT "advanced"
    const nonAdvancedTab = availableTabs.find(tab => tab.value !== 'advanced');
    // If we found a non-advanced tab, use it; otherwise fall back to 'staff'
    return nonAdvancedTab?.value || 'staff';
  }, [availableTabs]);

  // Calculate max columns needed for grid layout
  const maxCols = useMemo(() => {
    return Math.max(row1Tabs.length, row2Tabs.length, 5);
  }, [row1Tabs.length, row2Tabs.length]);

  // Cache active section to localStorage (with user/workspace scoping)
  const cacheKey = useCacheKey();
  const getInitialSection = () => {
    // Initialize from URL or default to first available tab
    const initial = params.section || defaultSection || 'staff';
    activeSectionRef.current = initial;
    return initial;
  };
  const [activeSection, setActiveSection] = useLocalStorageCache<string>(
    cacheKey('admintab', undefined, undefined, 'activeSection'),
    getInitialSection()
  );
  
  // Update ref when activeSection changes
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Initialize and sync route - consolidated to prevent navigation conflicts
  useEffect(() => {
    // Skip if navigation is already in progress
    if (navigationInProgressRef.current) {
      return;
    }

    // Skip if this is a user-initiated navigation (with a delay to allow navigation to complete)
    if (isUserActionRef.current) {
      // Clear any existing timeout
      if (userActionTimeoutRef.current) {
        clearTimeout(userActionTimeoutRef.current);
      }
      // Reset the flag after navigation has time to complete
      userActionTimeoutRef.current = setTimeout(() => {
        isUserActionRef.current = false;
      }, 300);
      return;
    }

    // Don't navigate if we don't have tabs yet
    if (availableTabs.length === 0 || !defaultSection) {
      return;
    }

    const sectionFromPath = params.section;
    
    // If we have a section in the URL, check if it's valid first
    if (sectionFromPath) {
      const isValidSection = availableTabs.some(tab => tab.value === sectionFromPath);
      
      // If valid section, just sync state (never navigate away from valid sections)
      if (isValidSection) {
        // Only update state if it doesn't match
        if (activeSectionRef.current !== sectionFromPath) {
          activeSectionRef.current = sectionFromPath;
          setActiveSection(sectionFromPath);
          lastNavigatedSectionRef.current = sectionFromPath;
        } else if (lastNavigatedSectionRef.current !== sectionFromPath) {
          // State matches but we haven't tracked it yet
          lastNavigatedSectionRef.current = sectionFromPath;
        }
        return; // Never navigate away from valid sections
      }
      
      // Invalid section - redirect to default (only if not already there)
      if (!isValidSection && defaultSection && activeSectionRef.current !== defaultSection && lastNavigatedSectionRef.current !== defaultSection) {
        navigationInProgressRef.current = true;
        lastNavigatedSectionRef.current = defaultSection;
        activeSectionRef.current = defaultSection;
        setActiveSection(defaultSection);
        
        requestAnimationFrame(() => {
          try {
            navigate(`/admin/${defaultSection}`, { replace: true });
          } catch (err) {
            console.error('Navigation error:', err);
            lastNavigatedSectionRef.current = null;
          } finally {
            navigationInProgressRef.current = false;
          }
        });
      }
      return;
    }
    
    // Handle no section or old 'defaults' route - only navigate once on initial load
    if (!sectionFromPath || sectionFromPath === 'defaults') {
      if ((location.pathname === '/admin' || location.pathname === '/admin/' || sectionFromPath === 'defaults') && !initializedRef.current) {
        // Only navigate if we're not already on the default section
        if (defaultSection && activeSectionRef.current !== defaultSection && lastNavigatedSectionRef.current !== defaultSection) {
          initializedRef.current = true;
          navigationInProgressRef.current = true;
          lastNavigatedSectionRef.current = defaultSection;
          activeSectionRef.current = defaultSection;
          setActiveSection(defaultSection);
          
          // Use requestAnimationFrame to defer navigation
          requestAnimationFrame(() => {
            try {
              navigate(`/admin/${defaultSection}`, { replace: true });
            } catch (err) {
              console.error('Navigation error:', err);
              lastNavigatedSectionRef.current = null;
            } finally {
              navigationInProgressRef.current = false;
            }
          });
        }
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (userActionTimeoutRef.current) {
        clearTimeout(userActionTimeoutRef.current);
      }
    };
  }, [params.section, defaultSection, availableTabs.length, navigate, location.pathname]); // Removed activeSection from deps to prevent loops

  // Update route when section changes from user action
  const handleSectionChange = (newSection: string) => {
    // Skip if already navigating
    if (navigationInProgressRef.current) {
      return;
    }
    
    // Skip if section is already active and URL matches
    if (activeSectionRef.current === newSection && params.section === newSection) {
      return;
    }
    
    // Skip if we just navigated to this section
    if (lastNavigatedSectionRef.current === newSection && params.section === newSection) {
      return;
    }
    
    // Set flags to prevent useEffect from interfering
    isUserActionRef.current = true;
    navigationInProgressRef.current = true;
    activeSectionRef.current = newSection;
    lastNavigatedSectionRef.current = newSection;
    setActiveSection(newSection);
    
    // Navigate immediately (no deferral needed since we've set all the guards)
    try {
      navigate(`/admin/${newSection}`, { replace: true });
      // Reset navigation flag after a short delay
      setTimeout(() => {
        navigationInProgressRef.current = false;
      }, 100);
    } catch (err) {
      console.error('Navigation error:', err);
      isUserActionRef.current = false;
      navigationInProgressRef.current = false;
      lastNavigatedSectionRef.current = null;
    }
  };

  // If no tabs are available, show a message
  if (availableTabs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
          <p className="text-muted-foreground">You don't have permission to access any admin sections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-muted-foreground">Manage staff, documents, pricing, and permissions</p>
      </div>

      {/* Custom button-based tab navigator with two rows */}
      <div className="w-full">
        {/* Single connected tab bar container with two rows using CSS Grid */}
        <div
          className="inline-flex h-auto items-stretch rounded-md bg-muted p-1 text-muted-foreground w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(2, auto)',
            gap: 0
          }}
        >
          {/* Row 1 tabs (first 5) */}
          {row1Tabs.map((tab, index) => {
            const isActive = activeSection === tab.value;
            const isFirst = index === 0;
            const isLast = index === row1Tabs.length - 1;
            
            return (
              <button
                key={tab.value}
                onClick={() => handleSectionChange(tab.value)}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground",
                  isFirst && "rounded-tl-md",
                  isLast && row2Tabs.length === 0 && "rounded-tr-md"
                )}
                style={{ 
                  gridRow: 1,
                  gridColumn: index + 1
                }}
              >
                {tab.label}
              </button>
            );
          })}
          
          {/* Row 2 tabs (audit log first, then future tabs) */}
          {row2Tabs.map((tab, index) => {
            const isActive = activeSection === tab.value;
            const isFirst = index === 0;
            const isLast = index === row2Tabs.length - 1;
            
            return (
              <button
                key={tab.value}
                onClick={() => handleSectionChange(tab.value)}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground",
                  isFirst && "rounded-bl-md",
                  isLast && "rounded-br-md"
                )}
                style={{ 
                  gridRow: 2,
                  gridColumn: index + 1
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content for all tabs */}
        <div className="mt-6">
          {availableTabs.map((tab) => (
            <div
              key={tab.value}
              className={cn(
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeSection !== tab.value && "hidden"
              )}
            >
              {/* Advanced tab uses owner check instead of permission check */}
              {tab.value === 'advanced' ? (
                tab.component
              ) : (
                <Can permission={tab.permission} fallback={
                  <div className="text-center py-8">
                    <div className="text-slate-600">You don't have permission to view this section.</div>
                  </div>
                }>
                  {tab.component}
                </Can>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
