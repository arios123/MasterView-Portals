import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Project } from "@/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  filterAllowedStatuses, 
  isStatusDropdownDisabled 
} from "@/utils/statusPermissions";

interface CompletedProjectCardProps {
  project: Project;
  onStatusChange: (id: string, status: string) => void;
  onProfileClick?: (project: Project) => void;
  userRole: string;
  canEdit?: boolean;
}

export function CompletedProjectCard({ project, onStatusChange, onProfileClick, userRole, canEdit = false }: CompletedProjectCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);
  const { can } = usePermissions();
  
  const completedStatusName = projectStatuses.find(s => s.name === "Completed")?.name || "Completed";
  const soldStatusName = projectStatuses.find(s => s.name === "Sold")?.name || "Sold";
  const lostStatusName = projectStatuses.find(s => s.name === "Lost")?.name || "Lost";
  
  const isCompleted = project.status === completedStatusName;
  const isLost = project.status === lostStatusName;
  
  // Filter status options based on permissions
  const allowedStatuses = filterAllowedStatuses(projectStatuses, project.status, can);
  
  // Check if dropdown should be disabled
  // Need both edit permission for the tab AND status change permissions
  const isDropdownDisabled = isStatusDropdownDisabled(project.status, can, canEdit);
  
  const handleCardClick = () => {
    if (onProfileClick) {
      onProfileClick(project);
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Card 
      className="p-4 shadow-sm border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base leading-tight">
            {project.project}
          </h3>
          <p className="text-sm text-muted-foreground">
            {project.clientName}
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={handleSelectClick}>
          {/* Badge removed for Lost and Completed status - dropdown will be colored instead */}
          {!isLost && !isCompleted && (
            <Badge 
              variant="outline" 
              className="border-destructive/30 bg-destructive/10 text-destructive text-xs"
            >
              {project.status || "No Status"}
            </Badge>
          )}
          <Select 
            value={project.status || ""} 
            onValueChange={(value) => onStatusChange(project.id, value)} 
            disabled={isDropdownDisabled}
          >
            <SelectTrigger className={`w-full h-9 text-sm border ${
              isLost 
                ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20" 
                : isCompleted
                ? "bg-success/10 border-success/30 text-success hover:bg-success/20"
                : "bg-background border-border"
            }`}>
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {allowedStatuses.map((status) => (
                <SelectItem key={status.id} value={status.name} className="text-sm">
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}