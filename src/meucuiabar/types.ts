export type MeuCuiabarRole = 'admin' | 'supervisor' | 'operador';

export interface MeuCuiabarSessionUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  googleAccessScope?: string | null;
}

export interface MeuCuiabarSessionPayload {
  ok: boolean;
  authenticated: boolean;
  user: MeuCuiabarSessionUser | null;
  csrfToken: string | null;
}

export interface MeuCuiabarAuthConfig {
  ok: boolean;
  googleClientId: string | null;
  scopes: string[];
  masterEmails: string[];
}

export interface MeuCuiabarGoogleLoginPayload {
  ok: boolean;
  approved: boolean;
  pendingApproval?: boolean;
  approvalMessage?: string;
  user?: MeuCuiabarSessionUser | null;
  csrfToken?: string | null;
}

export interface MeuCuiabarAccessRequest {
  id: string;
  email: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  requestedAt?: string | null;
  scope: string[];
  status: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
