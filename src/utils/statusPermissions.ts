/**
 * Utility functions for checking project status change permissions
 * 
 * Permissions:
 * - component.other_statussold.set - Allow changing TO "Sold" status
 * - component.other_statussold.change - Allow changing FROM "Sold" status
 * - component.other_statuscompleted.set - Allow changing TO "Completed" status
 * - component.other_statuscompleted.change - Allow changing FROM "Completed" status
 * - component.other_statuslost.set - Allow changing TO "Lost" status
 * - component.other_statuslost.change - Allow changing FROM "Lost" status
 */

export type StatusPermissionChecker = (permissionKey: string) => boolean;

/**
 * Check if user can change FROM a specific status
 */
export const canChangeFromStatus = (
  currentStatus: string | null,
  can: StatusPermissionChecker
): boolean => {
  if (!currentStatus) return true; // No status means can change

  const statusLower = currentStatus.toLowerCase();
  
  if (statusLower === 'sold') {
    return can('component.other_statussold.change');
  }
  
  if (statusLower === 'completed') {
    return can('component.other_statuscompleted.change');
  }
  
  if (statusLower === 'lost') {
    return can('component.other_statuslost.change');
  }
  
  // For other statuses, allow change (unless restricted by other permissions)
  return true;
};

/**
 * Check if user can change TO a specific status
 */
export const canChangeToStatus = (
  targetStatus: string,
  currentStatus: string | null,
  can: StatusPermissionChecker
): boolean => {
  const targetStatusLower = targetStatus.toLowerCase();
  const currentStatusLower = currentStatus?.toLowerCase() || '';
  
  // If already at this status, no change needed
  if (currentStatusLower === targetStatusLower) {
    return true;
  }
  
  // Check if can set TO target status
  if (targetStatusLower === 'sold') {
    // Special case: If coming from "Completed", need both permissions
    if (currentStatusLower === 'completed') {
      return can('component.other_statuscompleted.change') && 
             can('component.other_statussold.set');
    }
    return can('component.other_statussold.set');
  }
  
  if (targetStatusLower === 'completed') {
    // Special case: If coming from "Sold", need both permissions
    if (currentStatusLower === 'sold') {
      return can('component.other_statussold.change') && 
             can('component.other_statuscompleted.set');
    }
    return can('component.other_statuscompleted.set');
  }
  
  if (targetStatusLower === 'lost') {
    // Special case: If coming from "Sold", need both permissions
    if (currentStatusLower === 'sold') {
      return can('component.other_statussold.change') && 
             can('component.other_statuslost.set');
    }
    // Special case: If coming from "Completed", need both permissions
    if (currentStatusLower === 'completed') {
      return can('component.other_statuscompleted.change') && 
             can('component.other_statuslost.set');
    }
    return can('component.other_statuslost.set');
  }
  
  // For other statuses, check if we can change FROM current status
  // (e.g., if current is "Sold", need sold.change permission)
  return canChangeFromStatus(currentStatus, can);
};

/**
 * Filter status options based on permissions
 * Returns only statuses the user can change TO
 */
export const filterAllowedStatuses = (
  allStatuses: Array<{ id: string; name: string }>,
  currentStatus: string | null,
  can: StatusPermissionChecker
): Array<{ id: string; name: string }> => {
  return allStatuses.filter(status => 
    canChangeToStatus(status.name, currentStatus, can)
  );
};

/**
 * Check if status dropdown should be disabled
 * Disabled if user cannot change FROM current status
 */
export const isStatusDropdownDisabled = (
  currentStatus: string | null,
  can: StatusPermissionChecker,
  hasEditPermission: boolean
): boolean => {
  // If no edit permission at all, disable
  if (!hasEditPermission) {
    return true;
  }
  
  // If can't change from current status, disable entire dropdown
  return !canChangeFromStatus(currentStatus, can);
};
