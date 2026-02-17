import React from 'react';
import { usePermissions, FeatureKey } from '@/hooks/usePermissions';

interface PermissionGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireWrite?: boolean;
  requireRead?: boolean;
}

/**
 * PermissionGate component - wraps UI elements that should be permission-controlled
 * Follows the SaaS-ready RBAC pattern from cursor rules
 * 
 * Usage:
 * <PermissionGate feature="activity">
 *   <ActivityTab />
 * </PermissionGate>
 * 
 * <PermissionGate feature="payments" requireWrite>
 *   <EditPaymentsButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  feature,
  children,
  fallback = null,
  requireWrite = false,
  requireRead = false,
}) => {
  const { canView, canRead, canWrite } = usePermissions();

  // If requireWrite is true, check write permission
  if (requireWrite) {
    if (!canWrite(feature)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // If requireRead is true, check read permission
  if (requireRead) {
    if (!canRead(feature)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Default: check view permission
  if (!canView(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Higher-order component version for class components or advanced use cases
 */
export const withPermissionGate = <P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureKey,
  requireWrite = false,
  requireRead = false
) => {
  return (props: P) => (
    <PermissionGate feature={feature} requireWrite={requireWrite} requireRead={requireRead}>
      <Component {...props} />
    </PermissionGate>
  );
};

