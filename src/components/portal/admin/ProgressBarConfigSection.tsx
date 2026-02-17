import { useState, useEffect } from 'react';
import { GripVertical, Trash2, Save, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { useProjectProgressConfig } from '@/hooks/useProjectProgressConfig';
import { projectProgressConfigQueries } from '@/queries/projectProgressConfig';
import { toast } from 'sonner';
import { SegmentedBar, LabelsRow } from '../SegmentedBar';

interface Segment {
  id: string;
  status_id: string | null;
  status_name?: string | null;
  percentage: number;
  display_order: number;
}

interface SortableSegmentItemProps {
  segment: Segment;
  availableStatuses: Array<{ id: string; name: string; color: string }>;
  onStatusChange: (segmentId: string, statusId: string | null) => void;
  onPercentageChange: (segmentId: string, percentage: number) => void;
  onRemoveStatus: (segmentId: string) => void;
  canEdit: boolean;
}

function SortableSegmentItem({
  segment,
  availableStatuses,
  onStatusChange,
  onPercentageChange,
  onRemoveStatus,
  canEdit,
}: SortableSegmentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const selectedStatus = segment.status_id 
    ? availableStatuses.find(s => s.id === segment.status_id)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors space-y-3"
    >
      <div className="flex items-center gap-3">
        {canEdit && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Segment {segment.display_order}
          </Label>
          <div className="flex items-center gap-2">
            {selectedStatus ? (
              <>
                <div
                  className="w-4 h-4 rounded border flex-shrink-0"
                  style={{ backgroundColor: selectedStatus.color }}
                />
                <span className="font-medium">{selectedStatus.name}</span>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveStatus(segment.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground italic">Empty slot</span>
            )}
          </div>
        </div>
        <div className="w-24">
          <Label className="text-xs text-muted-foreground mb-2 block">Percentage</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={segment.percentage}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              onPercentageChange(segment.id, Math.min(100, Math.max(0, val)));
            }}
            disabled={!canEdit}
            className="h-9"
          />
        </div>
      </div>
      {canEdit && !selectedStatus && (
        <div className="text-xs text-muted-foreground">
          Drag a status from the list below to assign it to this segment
        </div>
      )}
    </div>
  );
}

export function ProgressBarConfigSection() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('component.adminworkspacesetup_progressbar.view');
  const canEdit = can('component.adminworkspacesetup_progressbar.edit');
  const canEditEnabled = canView && canEdit;
  
  const workspaceId = currentWorkspace?.id;
  const { projectStatuses, loading: statusesLoading } = useProjectStatuses(workspaceId);
  const { config, loading: configLoading, refetch: refetchConfig } = useProjectProgressConfig(workspaceId);

  const [numSegments, setNumSegments] = useState(3);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [draggedStatusId, setDraggedStatusId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize segments from config or default
  useEffect(() => {
    if (config && config.segments) {
      setNumSegments(config.num_segments);
      const mappedSegments: Segment[] = config.segments.map(seg => ({
        id: `seg-${seg.id}`,
        status_id: seg.status_id,
        status_name: seg.status_id 
          ? projectStatuses.find(s => s.id === seg.status_id)?.name || null
          : null,
        percentage: seg.percentage,
        display_order: seg.display_order,
      }));
      setSegments(mappedSegments);
      setHasChanges(false);
    } else if (!configLoading) {
      // Default: 3 segments with empty slots
      const defaultSegments: Segment[] = Array.from({ length: 3 }, (_, i) => ({
        id: `seg-new-${i}`,
        status_id: null,
        percentage: Math.floor(100 / 3),
        display_order: i + 1,
      }));
      setSegments(defaultSegments);
      setNumSegments(3);
      setHasChanges(false);
    }
  }, [config, configLoading, projectStatuses]);

  // Update segments when numSegments changes
  useEffect(() => {
    if (numSegments < 2 || numSegments > 6) return;
    
    const currentCount = segments.length;
    if (numSegments > currentCount) {
      // Add new empty segments
      const newSegments: Segment[] = Array.from({ length: numSegments - currentCount }, (_, i) => ({
        id: `seg-new-${Date.now()}-${i}`,
        status_id: null,
        percentage: 0,
        display_order: currentCount + i + 1,
      }));
      setSegments([...segments, ...newSegments]);
      setHasChanges(true);
    } else if (numSegments < currentCount) {
      // Remove last segments
      const newSegments = segments.slice(0, numSegments);
      // Recalculate percentages evenly if total would be 0
      const total = newSegments.reduce((sum, s) => sum + s.percentage, 0);
      if (total === 0) {
        const perSegment = Math.floor(100 / numSegments);
        newSegments.forEach(s => { s.percentage = perSegment; });
      }
      setSegments(newSegments.map((s, i) => ({ ...s, display_order: i + 1 })));
      setHasChanges(true);
    }
  }, [numSegments]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSegmentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !canEditEnabled) return;

    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newSegments = arrayMove(segments, oldIndex, newIndex);
      setSegments(newSegments.map((s, i) => ({ ...s, display_order: i + 1 })));
      setHasChanges(true);
    }
  };

  const handleStatusDragStart = (event: DragStartEvent) => {
    if (typeof event.active.id === 'string' && event.active.id.startsWith('status-')) {
      setDraggedStatusId(event.active.id.replace('status-', ''));
    }
  };

  const handleStatusDrop = (segmentId: string) => {
    if (!draggedStatusId || !canEditEnabled) return;

    // Check if status is already assigned to another segment
    const existingSegment = segments.find(s => s.status_id === draggedStatusId && s.id !== segmentId);
    if (existingSegment) {
      toast.error('This status is already assigned to another segment');
      setDraggedStatusId(null);
      return;
    }

    setSegments(segments.map(s => 
      s.id === segmentId 
        ? { ...s, status_id: draggedStatusId, status_name: projectStatuses.find(st => st.id === draggedStatusId)?.name || null }
        : s
    ));
    setHasChanges(true);
    setDraggedStatusId(null);
  };

  const handleRemoveStatus = (segmentId: string) => {
    if (!canEditEnabled) return;
    setSegments(segments.map(s => 
      s.id === segmentId 
        ? { ...s, status_id: null, status_name: null }
        : s
    ));
    setHasChanges(true);
  };

  const handlePercentageChange = (segmentId: string, percentage: number) => {
    if (!canEditEnabled) return;
    setSegments(segments.map(s => 
      s.id === segmentId 
        ? { ...s, percentage }
        : s
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!workspaceId || !user?.id || !canEditEnabled) return;

    // Validate
    const totalPercentage = segments.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage > 100) {
      toast.error(`Total percentage cannot exceed 100% (currently ${totalPercentage}%)`);
      return;
    }

    setIsSaving(true);
    try {
      await projectProgressConfigQueries.createOrUpdate(
        workspaceId,
        numSegments,
        segments.map(s => ({
          status_id: s.status_id,
          percentage: s.percentage,
        })),
        user.id
      );
      toast.success('Progress bar configuration saved');
      setHasChanges(false);
      await refetchConfig();
    } catch (error: any) {
      console.error('Error saving progress config:', error);
      toast.error(error.message || 'Failed to save progress configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to config
    if (config && config.segments) {
      setNumSegments(config.num_segments);
      const mappedSegments: Segment[] = config.segments.map(seg => ({
        id: `seg-${seg.id}`,
        status_id: seg.status_id,
        status_name: seg.status_id 
          ? projectStatuses.find(s => s.id === seg.status_id)?.name || null
          : null,
        percentage: seg.percentage,
        display_order: seg.display_order,
      }));
      setSegments(mappedSegments);
      setHasChanges(false);
    }
  };

  // Get unassigned statuses
  const assignedStatusIds = segments.filter(s => s.status_id).map(s => s.status_id!);
  const unassignedStatuses = projectStatuses.filter(s => !assignedStatusIds.includes(s.id));

  // Calculate preview percentages (cumulative)
  const previewLabels = segments.map((seg, index) => {
    if (seg.status_id) {
      const status = projectStatuses.find(s => s.id === seg.status_id);
      return status?.name || `Segment ${index + 1}`;
    }
    return `Segment ${index + 1}`;
  });

  const previewPercentages = segments.map(seg => seg.percentage);

  if (statusesLoading || configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Bar Configuration</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Bar Configuration</CardTitle>
        <CardDescription>
          Configure how project statuses map to progress percentages. Drag statuses into segments and set their percentages.
          Percentages can total up to 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segment Count */}
        {canEdit && (
          <div className="space-y-2">
            <Label>Number of Segments</Label>
            <Input
              type="number"
              min="2"
              max="6"
              value={numSegments}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 2;
                setNumSegments(Math.min(6, Math.max(2, val)));
              }}
              disabled={!canEdit}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Choose between 2-6 segments for your progress bar
            </p>
          </div>
        )}

        {/* Preview */}
        {segments.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <SegmentedBar 
              segmentPercentages={previewPercentages}
              percentage={previewPercentages.reduce((sum, p) => sum + p, 0)}
            />
            <LabelsRow labels={previewLabels} />
          </div>
        )}

        {/* Segments List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSegmentDragEnd}
          onDragStart={handleStatusDragStart}
        >
          <SortableContext
            items={segments.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedStatusId) {
                      handleStatusDrop(segment.id);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedStatusId) {
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (draggedStatusId && canEdit) {
                      e.currentTarget.classList.add('ring-2', 'ring-primary');
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-primary');
                  }}
                  className={draggedStatusId && canEdit ? 'transition-all' : ''}
                >
                  <SortableSegmentItem
                    segment={segment}
                    availableStatuses={projectStatuses}
                    onStatusChange={() => {}}
                    onPercentageChange={handlePercentageChange}
                    onRemoveStatus={handleRemoveStatus}
                    canEdit={canEditEnabled}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Available Statuses to Drag */}
        {canEdit && unassignedStatuses.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
            <Label className="text-sm font-medium">Available Statuses</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Drag a status onto a segment above to assign it
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedStatuses.map((status) => (
                <div
                  key={status.id}
                  id={`status-${status.id}`}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedStatusId(status.id);
                  }}
                  onDragEnd={() => setDraggedStatusId(null)}
                  className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background cursor-move hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm font-medium">{status.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save/Cancel */}
        {canEdit && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!hasChanges || isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

