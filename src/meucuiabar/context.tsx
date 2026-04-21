import { createContext, useContext } from 'react';
import type { MeuCuiabarRole, MeuCuiabarSessionPayload } from './types';

type CurrentMeuCuiabarUser = {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  role: MeuCuiabarRole;
  avatar_url: string | null;
  unit_id: string | null;
};

export type MeuCuiabarSessionContextValue = {
  session: MeuCuiabarSessionPayload;
  csrfToken: string | null;
  currentUser: CurrentMeuCuiabarUser | null;
  isMaster: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const resolveMeuCuiabarRole = (session: MeuCuiabarSessionPayload): MeuCuiabarRole => {
  const roles = session.user?.roles ?? [];
  return roles.includes('gerente') ? 'admin' : 'operador';
};

export const mapSessionUserToMeuCuiabarUser = (session: MeuCuiabarSessionPayload): CurrentMeuCuiabarUser | null => {
  if (!session.user) {
    return null;
  }

  const displayName = session.user.displayName?.trim() || session.user.email;
  const firstName = session.user.firstName ?? displayName.split(/\s+/)[0] ?? null;
  const lastName =
    session.user.lastName ?? (displayName.includes(' ') ? displayName.split(/\s+/).slice(1).join(' ') : null);

  return {
    id: session.user.id,
    email: session.user.email,
    full_name: displayName,
    first_name: firstName,
    last_name: lastName,
    role: resolveMeuCuiabarRole(session),
    avatar_url: session.user.avatarUrl ?? null,
    unit_id: null,
  };
};

export const MeuCuiabarSessionContext = createContext<MeuCuiabarSessionContextValue | null>(null);

export const useMeuCuiabarSession = () => {
  const context = useContext(MeuCuiabarSessionContext);
  if (!context) {
    throw new Error('useMeuCuiabarSession must be used within MeuCuiabarSessionContext.');
  }
  return context;
};
