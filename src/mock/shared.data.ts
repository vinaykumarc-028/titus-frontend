// ============================================================
// Consolidated Mock Data
// BACKEND INTEGRATION: Replace with API calls
// ============================================================

import React from 'react';
import {
  Users,
  FileText,
  Settings,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ListTodo,
  BarChart3,
} from 'lucide-react';
import type {
  AdminMetricCard,
  AdminActivityItem,
  QuickActionItem,
  AdminDocItem,
  ReportMetric,
  ChartBarItem,
  CategoryDistribution,
  AuditLogEntry,
  CategoryItem,
  DashboardMetrics,
  ActivityEntry,
  RecentDocument,
  UnfinishedWorkItem,
  DocumentItem,
  JobItem,
  NotificationItem,
  UserItem,
} from '../types';

// ============================================================
// Admin Dashboard Mock Data
// ============================================================

export const ADMIN_DASHBOARD_SUMMARY_CARDS: AdminMetricCard[] = [
  { label: 'Total Users', value: '1,248', color: 'var(--primary)', subtitle: 'Active platform users' },
  { label: 'Documents Today', value: '452', color: 'var(--success)', subtitle: '+12% from yesterday' },
  { label: 'Processing', value: '18', color: 'var(--warning)', subtitle: 'Awaiting OCR reading' },
  { label: 'Completed', value: '12,450', color: 'var(--success)', subtitle: '99.2% success rate' },
  { label: 'Failed', value: '24', color: 'var(--danger)', subtitle: 'Requires manual verification' },
  { label: 'Storage Used', value: '42.5 GB', color: 'var(--accent-purple)', subtitle: '42.5% of total capacity' },
];

export const ADMIN_DASHBOARD_SUMMARY_CARD_ICONS: Record<string, React.ReactNode> = {
  'Total Users': React.createElement(Users, { size: 20 }),
  'Documents Today': React.createElement(FileText, { size: 20 }),
  'Processing': React.createElement(Settings, { size: 20 }),
  'Completed': React.createElement(CheckCircle2, { size: 20 }),
  'Failed': React.createElement(AlertCircle, { size: 20 }),
  'Storage Used': React.createElement(HardDrive, { size: 20 }),
};

export const ADMIN_DASHBOARD_QUICK_ACTIONS: QuickActionItem[] = [
  { title: 'Manage Users', desc: 'Create, edit, and configure role privileges for platform users.', to: '/admin/users' },
  { title: 'View Documents', desc: 'Inspect, filter, and review converted documents and logs.', to: '/admin/documents' },
  { title: 'View Reports', desc: 'Track performance trends, OCR accuracy, and usage metrics.', to: '/admin/reports' },
  { title: 'System Settings', desc: 'Adjust platform configuration, timeouts, and metadata schema.', to: '/admin/settings' },
];

export const ADMIN_DASHBOARD_QUICK_ACTION_ICONS: Record<string, React.ReactNode> = {
  'Manage Users': React.createElement(Users, { size: 28 }),
  'View Documents': React.createElement(ListTodo, { size: 28 }),
  'View Reports': React.createElement(BarChart3, { size: 28 }),
  'System Settings': React.createElement(Settings, { size: 28 }),
};

export const ADMIN_DASHBOARD_RECENT_ACTIVITY: AdminActivityItem[] = [
  { id: 1, text: 'New document uploaded: Mathematics Midterm', time: '10 mins ago', type: 'document' },
  { id: 2, text: 'User "Alice Admin" signed in', time: '25 mins ago', type: 'user' },
  { id: 3, text: 'Document converted: Physics Lab Manual', time: '1 hour ago', type: 'system' },
  { id: 4, text: 'Review completed for Biology Final', time: '2 hours ago', type: 'user' },
  { id: 5, text: 'Answer Key generated for Chemistry Quiz', time: '3 hours ago', type: 'system' },
  { id: 6, text: 'User "John Doe" created', time: '5 hours ago', type: 'admin' },
  { id: 7, text: 'Document deleted by System', time: '1 day ago', type: 'danger' },
];

// ============================================================
// Admin Documents Mock Data
// ============================================================

export const ADMIN_DOCUMENTS_INITIAL_DOCUMENTS: AdminDocItem[] = [
  { id: 1, name: 'Physics Final Exam 2023', category: 'Question Paper', date: '2023-10-24 10:30', status: 'Completed', owner: 'Alice Admin' },
  { id: 2, name: 'Biology Lab Manual', category: 'Lab Manual', date: '2023-10-24 09:15', status: 'Processing', owner: 'John Doe' },
  { id: 3, name: 'Math Quiz Week 4', category: 'Worksheet', date: '2023-10-23 16:45', status: 'Failed', owner: 'Michael Chen' },
  { id: 4, name: 'History Lecture Notes', category: 'Lecture Notes', date: '2023-10-23 11:20', status: 'Completed', owner: 'Sarah Smith' },
  { id: 5, name: 'Chemistry Assignment 2', category: 'Assignment', date: '2023-10-22 14:00', status: 'Review Needed', owner: 'Emma Wilson' },
];

// ============================================================
// Admin Reports Mock Data
// ============================================================

export const ADMIN_REPORTS_SUMMARY_METRICS: ReportMetric[] = [
  { label: 'Documents Uploaded', value: '1,452', trend: '+12%', trendDirection: 'up', trendLabel: 'this week', color: 'var(--primary)' },
  { label: 'Documents Converted', value: '1,320', trend: '+15%', trendDirection: 'up', trendLabel: 'this week', color: 'var(--success)' },
  { label: 'Pending Reviews', value: '84', trend: '-5%', trendDirection: 'down', trendLabel: 'this week', color: 'var(--warning)' },
  { label: 'Completed Reviews', value: '1,236', trend: '+8%', trendDirection: 'up', trendLabel: 'this week', color: 'var(--success)' },
];

export const ADMIN_REPORTS_MOCK_ACTIVITY: ChartBarItem[] = [
  { day: 'Mon', value: 40 },
  { day: 'Tue', value: 70 },
  { day: 'Wed', value: 45 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 65 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 50 },
];

export const ADMIN_REPORTS_MOCK_CATEGORIES: CategoryDistribution[] = [
  { name: 'Question Paper', percentage: 45, color: 'var(--primary)' },
  { name: 'Assignment', percentage: 25, color: 'var(--accent-purple)' },
  { name: 'Lecture Notes', percentage: 15, color: 'var(--warning)' },
  { name: 'Study Notes', percentage: 10, color: 'var(--success)' },
  { name: 'Other', percentage: 5, color: 'var(--text-muted)' },
];

// ============================================================
// Admin Audit Logs Mock Data
// ============================================================

export const ADMIN_AUDIT_LOGS_MOCK_LOGS: AuditLogEntry[] = [
  { id: 1, date: '2023-10-24 10:45:12', user: 'System', action: 'Document Converted', document: 'Physics Final Exam', status: 'Success' },
  { id: 2, date: '2023-10-24 10:30:05', user: 'Alice Admin', action: 'User Created', document: 'N/A', status: 'Success' },
  { id: 3, date: '2023-10-24 09:15:30', user: 'System', action: 'OCR Processing', document: 'Math Quiz Week 4', status: 'Failed' },
  { id: 4, date: '2023-10-23 16:45:00', user: 'John Doe', action: 'Document Uploaded', document: 'Math Quiz Week 4', status: 'Info' },
  { id: 5, date: '2023-10-23 11:20:15', user: 'Sarah Smith', action: 'Review Completed', document: 'History Lecture Notes', status: 'Success' },
  { id: 6, date: '2023-10-23 10:05:40', user: 'System', action: 'System Backup', document: 'N/A', status: 'Warning' },
  { id: 7, date: '2023-10-22 14:00:22', user: 'Emma Wilson', action: 'Document Deleted', document: 'Chemistry Assignment 2', status: 'Warning' },
];

// ============================================================
// Categories Mock Data (Admin Portal)
// ============================================================

export const ADMIN_CATEGORIES_INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 1, name: 'Question Paper', desc: 'Official exams, midterms, and weekly test papers.', icon: '📘', count: 142, status: 'Active', updated: '2 hours ago' },
  { id: 2, name: 'Answer Key', desc: 'Reference keys and solutions for graded exams.', icon: '🔑', count: 85, status: 'Active', updated: 'Today' },
  { id: 3, name: 'Assignment', desc: 'Homework sheets, problem sets, and projects.', icon: '📙', count: 320, status: 'Active', updated: 'Yesterday' },
  { id: 4, name: 'Lecture Notes', desc: 'Classroom presentations and transcription notes.', icon: '📗', count: 110, status: 'Active', updated: '3 days ago' },
  { id: 5, name: 'Study Notes', desc: 'Summaries, flashcard topics, and quick-ref guides.', icon: '📝', count: 95, status: 'Active', updated: 'Oct 15, 2023' },
  { id: 6, name: 'Lab Manual', desc: 'Instructions and templates for laboratory practicals.', icon: '🔬', count: 42, status: 'Active', updated: '5 days ago' },
  { id: 7, name: 'Worksheet', desc: 'Practice worksheets and drill papers.', icon: '✏️', count: 215, status: 'Active', updated: 'Oct 20, 2023' },
  { id: 8, name: 'Research Paper', desc: 'Academic journal submissions and source papers.', icon: '📕', count: 18, status: 'Active', updated: '1 week ago' },
  { id: 9, name: 'Project Report', desc: 'Term projects, group studies, and final presentations.', icon: '📁', count: 56, status: 'Inactive', updated: '2 weeks ago' },
  { id: 10, name: 'Circular', desc: 'Administrative announcements and policy updates.', icon: '📢', count: 34, status: 'Active', updated: '3 days ago' },
  { id: 11, name: 'Official Document', desc: 'Accreditation, transcript requests, and certificates.', icon: '🏛️', count: 89, status: 'Active', updated: 'Yesterday' },
  { id: 12, name: 'Other', desc: 'Miscellaneous and uncategorized file uploads.', icon: '📄', count: 12, status: 'Active', updated: 'Oct 24, 2023' },
];

// ============================================================
// Dashboard Mock Data
// ============================================================

export const DASHBOARD_SUMMARY_METRICS: DashboardMetrics = {
  today: 12,
  processing: 2,
  pendingReview: 4,
  completed: 89,
};

export const DASHBOARD_UNFINISHED_WORK: UnfinishedWorkItem[] = [
  {
    id: 'doc-101',
    name: 'Biology Midterm.pdf',
    status: 'pending_review',
    step: 'Review Document',
    lastModified: '10 minutes ago',
  },
];

export const DASHBOARD_RECENT_DOCUMENTS: RecentDocument[] = [
  { id: '1', name: 'Physics Final.pdf', subject: 'Physics', pages: 12, date: 'Today, 09:30 AM', status: 'completed' },
  { id: '2', name: 'Chemistry Assignment.jpg', subject: 'Chemistry', pages: 2, date: 'Today, 08:15 AM', status: 'processing' },
  { id: '3', name: 'History Essay.png', subject: 'History', pages: 4, date: 'Yesterday', status: 'pending_review' },
  { id: '4', name: 'Math Quiz.pdf', subject: 'Mathematics', pages: 3, date: 'Oct 23, 2023', status: 'failed' },
  { id: '5', name: 'Geography Map Notes.pdf', subject: 'Geography', pages: 1, date: 'Oct 22, 2023', status: 'completed' },
];

export const DASHBOARD_RECENT_ACTIVITY: ActivityEntry[] = [
  { time: '10:38 AM', text: 'HTML Document Generated for Physics Final' },
  { time: '10:35 AM', text: 'Review Saved for Physics Final' },
  { time: '10:33 AM', text: 'Reading Completed for Physics Final' },
  { time: '10:30 AM', text: 'Uploaded Physics Final.pdf' },
];

// ============================================================
// Documents Mock Data (User Portal)
// ============================================================

export const DOCUMENTS_INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: 1, name: 'Biology Midterm.pdf', subject: 'Science', date: 'Oct 24, 2023', status: 'Review Pending' },
  { id: 2, name: 'Math Assignment 4.jpg', subject: 'Mathematics', date: 'Oct 23, 2023', status: 'Completed' },
  { id: 3, name: 'History Essay.png', subject: 'History', date: 'Oct 20, 2023', status: 'Completed' },
];

// ============================================================
// Jobs Mock Data (User Portal — Document Conversion Queue)
// ============================================================

export const JOBS_MOCK_JOBS: JobItem[] = [
  { id: 'JOB-8291', subject: 'Mathematics', classGrade: 'Grade 10', uploadedAt: 'Today, 10:24 AM', status: 'Processing', operator: 'System' },
  { id: 'JOB-8290', subject: 'Physics', classGrade: 'Grade 12', uploadedAt: 'Today, 10:15 AM', status: 'Processing', operator: 'System' },
  { id: 'JOB-8289', subject: 'Biology', classGrade: 'Grade 11', uploadedAt: 'Today, 09:45 AM', status: 'Completed', operator: 'Operator 1' },
  { id: 'JOB-8288', subject: 'Chemistry', classGrade: 'Grade 12', uploadedAt: 'Today, 09:30 AM', status: 'Failed', operator: 'System' },
  { id: 'JOB-8287', subject: 'English', classGrade: 'Grade 9', uploadedAt: 'Yesterday, 04:00 PM', status: 'Review Pending', operator: 'Operator 2' },
  { id: 'JOB-8286', subject: 'History', classGrade: 'Grade 10', uploadedAt: 'Yesterday, 02:15 PM', status: 'Uploaded', operator: 'Operator 1' },
];

// ============================================================
// Notifications Mock Data
// ============================================================

export const NOTIFICATIONS_INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Document uploaded successfully', time: '10:30 AM', type: 'success', read: false },
  { id: '2', title: 'Reading completed for Physics Final', time: '10:35 AM', type: 'info', read: false },
  { id: '3', title: 'HTML document ready: Physics Final', time: '10:38 AM', type: 'success', read: false },
  { id: '4', title: 'Low OCR confidence detected in Math Quiz', time: '04:15 PM', type: 'warning', read: true },
  { id: '5', title: 'Review completed for Biology Midterm', time: '02:00 PM', type: 'success', read: true },
  { id: '6', title: 'AI Answer Key generated for Chemistry', time: 'Oct 23', type: 'info', read: true },
];

// ============================================================
// Users Mock Data (Admin Portal)
// ============================================================

export const USERS_INITIAL_USERS: UserItem[] = [
  { id: 1, name: 'Alice Admin', email: 'alice@titus.com', role: 'Administrator', status: 'Active', lastLogin: '10 mins ago' },
  { id: 2, name: 'John Doe', email: 'john@titus.com', role: 'Operator', status: 'Active', lastLogin: '2 hours ago' },
  { id: 3, name: 'Sarah Smith', email: 'sarah@titus.com', role: 'Reviewer', status: 'Inactive', lastLogin: '5 days ago' },
  { id: 4, name: 'Michael Chen', email: 'michael@titus.com', role: 'Operator', status: 'Active', lastLogin: '1 day ago' },
  { id: 5, name: 'Emma Wilson', email: 'emma@titus.com', role: 'Viewer', status: 'Active', lastLogin: '3 hours ago' },
];
