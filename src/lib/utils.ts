import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Builds a workspace-aware storage path for project attachments.
 * This ensures all files follow the convention:
 *   workspaceId/projectId/folder/fileName
 */
export function buildProjectAttachmentPath(
  workspaceId: string,
  projectId: string,
  folder: string,
  fileName: string,
) {
  return `${workspaceId}/${projectId}/${folder}/${fileName}`;
}

/**
 * Convenience helper for project document paths inside the project-attachments bucket.
 * Documents are stored under the "documents" folder:
 *   workspaceId/projectId/documents/fileName
 */
export function buildProjectDocumentPath(
  workspaceId: string,
  projectId: string,
  fileName: string,
) {
  return buildProjectAttachmentPath(workspaceId, projectId, "documents", fileName);
}
