// ============================================================
// Consolidated Entity Types
// Replace with API response types after backend integration
// ============================================================

// ============================================================
// Admin Entity Types
// ============================================================

/** Admin dashboard activity feed entry */
export interface AdminActivityItem {
  id: number;
  text: string;
  time: string;
  type: 'document' | 'user' | 'system' | 'admin' | 'danger';
}

/** Admin dashboard summary metric card */
export interface AdminMetricCard {
  label: string;
  value: string;
  color: string;
  subtitle: string;
}

/** Admin dashboard quick action card */
export interface QuickActionItem {
  title: string;
  desc: string;
  to: string;
}

/** Admin categories category row */
export interface CategoryItem {
  id: number;
  name: string;
  desc: string;
  icon: string;
  count: number;
  status: string;
  updated: string;
}

/** Admin audit logs log entry */
export interface AuditLogEntry {
  id: number;
  date: string;
  user: string;
  action: string;
  document: string;
  status: string;
}

/** Admin reports chart bar */
export interface ChartBarItem {
  day: string;
  value: number;
}

/** Admin reports category distribution */
export interface CategoryDistribution {
  name: string;
  percentage: number;
  color: string;
}

/** Admin reports summary metric */
export interface ReportMetric {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  trendLabel: string;
  color: string;
}

// ============================================================
// Document & Job Entity Types
// ============================================================

export type DocStatus = 'completed' | 'processing' | 'pending_review' | 'failed';

export type JobStatus = 'Uploaded' | 'Processing' | 'Review Pending' | 'Completed' | 'Failed';

/** User-portal document list item */
export interface DocumentItem {
  id: string | number;
  name: string;
  subject: string;
  date: string;
  status: string;
}

/** Dashboard recent document summary */
export interface RecentDocument {
  id: string;
  name: string;
  subject: string;
  pages: number;
  date: string;
  status: DocStatus;
}

/** Dashboard unfinished work item */
export interface UnfinishedWorkItem {
  id: string;
  name: string;
  status: string;
  step: string;
  lastModified: string;
}

/** Dashboard recent activity entry */
export interface ActivityEntry {
  time: string;
  text: string;
}

/** Dashboard summary metrics */
export interface DashboardMetrics {
  today: number;
  processing: number;
  pendingReview: number;
  completed: number;
}

/** Jobs page job row */
export interface JobItem {
  id: string;
  subject: string;
  classGrade: string;
  uploadedAt: string;
  status: JobStatus;
  operator: string;
}

/** Admin documents page document row */
export interface AdminDocItem {
  id: number;
  name: string;
  category: string;
  date: string;
  status: string;
  owner: string;
}

// ============================================================
// Notification Entity Types
// ============================================================

export type NotificationType = 'success' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

// ============================================================
// User Entity Types
// ============================================================

export type UserStatus = 'Active' | 'Inactive';

export type UserRole = 'Administrator' | 'Operator' | 'Reviewer' | 'Viewer';

/** Admin users page user row */
export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
}

/** User portal user list item (legacy Users.tsx — unrouted) */
export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
}
