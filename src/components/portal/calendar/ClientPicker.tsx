import React from 'react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { DatabaseClient } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface ClientPickerProps {
  clients: DatabaseClient[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  disabled?: boolean;
  onAddNewClient?: () => void;
}

export function ClientPicker({ clients, selectedClientId, onSelectClient, disabled, onAddNewClient }: ClientPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Client (Optional)</label>
        {onAddNewClient && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddNewClient}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add New Client
          </Button>
        )}
      </div>
      <SearchableSelect
        items={clients}
        value={selectedClientId}
        onSelect={onSelectClient}
        placeholder="Select client..."
        searchPlaceholder="Search clients..."
        emptyMessage="No client found."
        getItemValue={(client) => client.client_id}
        getItemLabel={(client) => client.name}
        disabled={disabled}
      />
    </div>
  );
}

