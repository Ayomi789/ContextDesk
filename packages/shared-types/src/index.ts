/**
 * Shared contracts between the ContextDesk API and its frontends.
 *
 * These mirror what `GET /api/v1/*` actually returns today —
 * including the snake_case dashboard fields — so clients stop
 * drifting (see the agon frontend's camelCase DashboardStats).
 */

export type UserRole = "ADMIN" | "AGENT";

export type TicketStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WAITING"
  | "RESOLVED";

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type MessageSenderType = "AGENT" | "CUSTOMER";

/** Computed per-ticket SLA state (see ticket.service getSlaStatus). */
export type SlaStatus =
  | "WITHIN_SLA"
  | "AT_RISK"
  | "BREACHED"
  | "RESOLVED"
  | "NO_SLA";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
}

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organization?: Organization;
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  tier: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  notes: string | null;
  accountId: string;
  organizationId: string;
  account?: Account;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDueAt: string | null;
  slaStatus: SlaStatus;
  contactId: string;
  accountId: string;
  organizationId: string;
  triageReason: string | null;
  assigneeId: string | null;
  contact?: Contact;
  account?: Account;
  assignee?: CrmUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  prevTickets: Ticket[];
}

export interface Message {
  id: string;
  body: string;
  isInternalNote: boolean;
  senderType: MessageSenderType;
  ticketId: string;
  authorId: string | null;
  author?: CrmUser | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  read: boolean;
  userId: string;
  ticketId: string | null;
  ticket?: {
    id: string;
    subject: string;
  } | null;
  createdAt: string;
}

export interface PriorityBucket {
  /** Capitalized by the API: Low | Medium | High | Urgent */
  priority: string;
  count: number;
}

export interface VolumePoint {
  date: string;
  count: number;
}

/** Shape of GET /api/v1/dashboard (after the { success } wrapper). */
export interface DashboardStats {
  total_tickets: number;
  new_tickets: number;
  in_progress: number;
  waiting: number;
  resolved: number;
  sla_at_risk: number;
  sla_due_soon: number;
  sla_on_track: number;
  by_priority: PriorityBucket[];
  volume_over_time: VolumePoint[];
}

export interface AuthPayload {
  token: string;
  user: CrmUser;
}
