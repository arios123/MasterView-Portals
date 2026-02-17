import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { UserCircle2, Plus } from "lucide-react";
import { Project } from "@/types";
import { Money, usePrice } from "@/contexts/PriceContext";
import { SegmentedBar } from "./SegmentedBar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { useProjectProgressConfig } from "@/hooks/useProjectProgressConfig";
import { projectProgressConfigQueries } from "@/queries/projectProgressConfig";
import { usePermissions } from "@/hooks/usePermissions";
import {
  filterAllowedStatuses,
  isStatusDropdownDisabled
} from "@/utils/statusPermissions";

export function ProjectCard({
  project,
  onStatusChange,
  onQuickNoteSave,
  onProfileClick,
  userRole,
  canEdit = false
}: {
  project: Project;
  onStatusChange: (id: string, status: string) => void;
  onQuickNoteSave: (id: string, note: string) => Promise<void>;
  onProfileClick: (project: Project) => void;
  userRole: string;
  canEdit?: boolean;
}) {
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);
  const { config: progressConfig } = useProjectProgressConfig(currentWorkspace?.id);
  const { can } = usePermissions();
  const { hidden } = usePrice();

  // Local state for quick note input (always starts empty - just for input)
  const [quickNote, setQuickNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  // Reset expanded state when project changes
  useEffect(() => {
    setIsExpanded(false);
  }, [project.id]);

  // Check if content exceeds 5rem (80px)
  useEffect(() => {
    if (noteRef.current && project.quickNote) {
      // Temporarily remove max-height to measure full height
      const originalStyle = noteRef.current.style.maxHeight;
      noteRef.current.style.maxHeight = 'none';
      const fullHeight = noteRef.current.scrollHeight;
      noteRef.current.style.maxHeight = originalStyle;

      const maxHeight = 80; // 5rem = 80px
      setNeedsTruncation(fullHeight > maxHeight);
    } else {
      setNeedsTruncation(false);
    }
  }, [project.quickNote]);

  // Filter status options based on permissions
  const allowedStatuses = filterAllowedStatuses(projectStatuses, project.status, can);

  // Check if dropdown should be disabled
  const isDropdownDisabled = isStatusDropdownDisabled(project.status, can, canEdit);

  // Handle quick note change (local state only)
  const handleQuickNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuickNote(value);
  };

  // Handle quick note save (append to existing quick note)
  const handleQuickNoteSave = async () => {
    if (!canEdit || !quickNote.trim()) return;
    setIsSaving(true);
    try {
      // Get current quick note from project
      const currentQuickNote = project.quickNote || "";
      // Append new note on a new line
      const newQuickNote = currentQuickNote
        ? `${currentQuickNote}\n${quickNote.trim()}`
        : quickNote.trim();

      await onQuickNoteSave(project.id, newQuickNote);
      // Clear the input after saving
      setQuickNote("");
    } catch (error) {
      console.error("Error saving quick note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate progress percentage from status
  // Returns cumulative percentage up to and including the matched segment
  const getProgressPercentage = (): number | null => {
    if (!project.status || !progressConfig || !progressConfig.segments) {
      return null;
    }

    // Sort all segments by display_order
    const sortedSegments = [...progressConfig.segments].sort((a, b) => a.display_order - b.display_order);

    // Find status_id by matching status name (case-sensitive exact match)
    const status = projectStatuses.find(s => s.name === project.status);
    if (!status) {
      // Status not found - use cumulative of first segment with a status as fallback
      const firstSegmentWithStatus = sortedSegments.find(s => s.status_id !== null);
      if (!firstSegmentWithStatus) return null;

      // Calculate cumulative up to and including this segment
      let cumulative = 0;
      for (const seg of sortedSegments) {
        cumulative += seg.percentage;
        if (seg.id === firstSegmentWithStatus.id) break;
      }
      return cumulative;
    }

    // Find exact match by status_id
    const exactMatch = sortedSegments.find(s => s.status_id === status.id);
    if (exactMatch) {
      // Calculate cumulative percentage up to and including this segment
      let cumulative = 0;
      for (const seg of sortedSegments) {
        cumulative += seg.percentage;
        // Stop when we reach the matched segment (inclusive)
        if (seg.id === exactMatch.id) {
          break;
        }
      }
      return cumulative;
    }

    // Find nearest lower percentage (for unmapped statuses)
    // Use the last segment with a status and calculate its cumulative
    const segmentsWithStatus = sortedSegments.filter(s => s.status_id !== null);
    if (segmentsWithStatus.length === 0) return 0;

    const lastSegmentWithStatus = segmentsWithStatus[segmentsWithStatus.length - 1];
    // Calculate cumulative up to and including this segment
    let cumulative = 0;
    for (const seg of sortedSegments) {
      cumulative += seg.percentage;
      if (seg.id === lastSegmentWithStatus.id) break;
    }
    return cumulative;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="flex items-start justify-between">
        <div>
          <button onClick={() => onProfileClick(project)} className="font-semibold hover:underline text-left">
            {project.clientName} — {project.project}
          </button>
          <div className="text-sm text-muted-foreground">{project.residence}</div>
          <div className="text-sm text-muted-foreground/70">Crew: {project.crew}</div>
          {project.quickNote && (
            <div className="text-sm mt-1">
              <div
                ref={noteRef}
                className="whitespace-pre-wrap"
                style={!isExpanded ? { maxHeight: '5rem', overflow: 'hidden' } : undefined}
              >
                {project.quickNote}
              </div>
              {needsTruncation && (
                <div className="mt-1">
                  {!isExpanded ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                      }}
                    >
                      Show More
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }}
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={project.status || ""}
            onValueChange={(v) => onStatusChange(project.id, v)}
            disabled={isDropdownDisabled}
          >
            <SelectTrigger className="w-[210px] rounded-xl bg-background border-border text-sm">
              <SelectValue placeholder={project.status || "No Status"} />
            </SelectTrigger>
            <SelectContent>
              {allowedStatuses.map(status => (
                <SelectItem key={status.id} value={status.name}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress visual */}
        {progressPercentage !== null && progressConfig && (
          <div>
            <div className="text-xs text-foreground mb-1">Progress</div>
            <SegmentedBar percentage={progressPercentage} />
          </div>
        )}
        {/* Metrics - hidden when client view is active */}
        {!hidden && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-muted-foreground">Total Project Cost</div><div className="font-semibold"><Money value={project.totalCost} /></div></div>
            <div><div className="text-muted-foreground">Total Paid</div><div className="font-semibold"><Money value={project.paid} /></div></div>
          </div>
        )}
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="rounded-xl" onClick={() => onProfileClick(project)}>
            <UserCircle2 className="w-4 h-4 mr-1"/> Profile
          </Button>
        </div>
        {/* Quick note */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Quick Note</div>
          <div className="flex gap-1">
            <Input
              placeholder="Type a private note..."
              value={quickNote}
              onChange={handleQuickNoteChange}
              disabled={!canEdit || isSaving}
              className="flex-1"
            />
            {canEdit && (
              <Button
                size="icon"
                variant="outline"
                onClick={handleQuickNoteSave}
                disabled={isSaving}
                className="h-10 w-10"
                title="Save quick note"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
