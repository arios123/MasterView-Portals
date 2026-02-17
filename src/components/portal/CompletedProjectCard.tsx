import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Project } from "@/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";

interface CompletedProjectCardProps {
  project: Project;
  onStatusChange: (id: string, status: string) => void;
  userRole: string;
}

export function CompletedProjectCard({ project, onStatusChange, userRole }: CompletedProjectCardProps) {
  const { currentWorkspace } = useWorkspace();
  const { projectStatuses } = useProjectStatuses(currentWorkspace?.id);
  
  const completedStatusName = projectStatuses.find(s => s.name === "Completed")?.name || "Completed";
  const soldStatusName = projectStatuses.find(s => s.name === "Sold")?.name || "Sold";
  
  const isCompleted = project.status === completedStatusName;
  const canChangeStatus = project.status !== soldStatusName;
  
  return (
    <Card className="p-4 shadow-sm border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-foreground truncate">
            {project.project}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {project.clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${
              isCompleted 
                ? "border-success/30 bg-success/10 text-success" 
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {project.status || "No Status"}
          </Badge>
          <Select 
            value={project.status || ""} 
            onValueChange={(value) => onStatusChange(project.id, value)} 
            disabled={!canChangeStatus}
          >
            <SelectTrigger className="w-28 h-8 text-xs bg-background border border-border">
              <SelectValue placeholder="Mark As" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {projectStatuses.map((status) => (
                <SelectItem key={status.id} value={status.name} className="text-xs">
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