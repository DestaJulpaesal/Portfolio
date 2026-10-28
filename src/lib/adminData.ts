import { apiRequest } from "./api";
import type {
  Project as ProjectContent,
  Certification as CertificationContent,
  ProfileData,
  AboutData,
  SkillsData,
} from "../data/content";

export interface ProjectRow extends ProjectContent {
  id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationRow extends CertificationContent {
  id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Omit<ProjectRow, "id" | "created_at" | "updated_at">;
export type CertificationInput = Omit<CertificationRow, "id" | "created_at" | "updated_at">;

export function fetchProjects() {
  return apiRequest<ProjectRow[]>("/api/projects");
}

export function createProject(input: ProjectInput) {
  return apiRequest<ProjectRow>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: Partial<ProjectInput>) {
  return apiRequest<ProjectRow>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string) {
  return apiRequest<void>(`/api/projects/${id}`, { method: "DELETE" });
}

export function fetchCertifications() {
  return apiRequest<CertificationRow[]>("/api/certifications");
}

export function createCertification(input: CertificationInput) {
  return apiRequest<CertificationRow>("/api/certifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCertification(id: string, input: Partial<CertificationInput>) {
  return apiRequest<CertificationRow>(`/api/certifications/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCertification(id: string) {
  return apiRequest<void>(`/api/certifications/${id}`, { method: "DELETE" });
}

export function reorderProjects(orderedIds: string[]) {
  return apiRequest<void>("/api/projects/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids: orderedIds }),
  });
}

export function reorderCertifications(orderedIds: string[]) {
  return apiRequest<void>("/api/certifications/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids: orderedIds }),
  });
}

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export function fetchMessages() {
  return apiRequest<MessageRow[]>("/api/messages");
}

export function markMessageRead(id: string, isRead: boolean) {
  return apiRequest<MessageRow>(`/api/messages/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: isRead }),
  });
}

export function deleteMessage(id: string) {
  return apiRequest<void>(`/api/messages/${id}`, { method: "DELETE" });
}

export async function countUnreadMessages() {
  const messages = await fetchMessages();
  return messages.filter((message) => !message.is_read).length;
}

export type AdminRole = "owner" | "editor";

export interface AdminUserRow {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export function fetchAdminUsers() {
  return apiRequest<AdminUserRow[]>("/api/admin-users");
}

export function addAdminUser(input: { email: string; password: string; role: AdminRole }) {
  return apiRequest<AdminUserRow>("/api/admin-users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminUserRole(id: string, role: AdminRole) {
  return apiRequest<AdminUserRow>(`/api/admin-users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeAdminUser(id: string) {
  return apiRequest<void>(`/api/admin-users/${id}`, { method: "DELETE" });
}

export type SiteContentSection = "profile" | "about" | "skills";

export function fetchSiteContent<T>(section: SiteContentSection) {
  return apiRequest<T | null>(`/api/site-content/${section}`);
}

export function saveSiteContent<T>(section: SiteContentSection, data: T) {
  return apiRequest<T>(`/api/site-content/${section}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export type { ProfileData, AboutData, SkillsData };
