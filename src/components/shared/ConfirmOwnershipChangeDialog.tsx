import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOwnershipChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName?: string;
}

/**
 * Confirmation dialog for ownership change
 * Warns that the action is irreversible
 */
export function ConfirmOwnershipChangeDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
}: ConfirmOwnershipChangeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Ownership Transfer</AlertDialogTitle>
          <AlertDialogDescription>
            {userName ? (
              <>
                Are you sure you want to transfer workspace ownership to <strong>{userName}</strong>?
              </>
            ) : (
              'Are you sure you want to transfer workspace ownership?'
            )}
            <br />
            <br />
            <strong className="text-destructive">
              This action is irreversible. You will lose access to the Advanced tab and will be redirected to the Projects page.
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Transfer Ownership
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

