export const contactStatusLabels: Record<string, string> = {
  active: 'Ativo',
  unsubscribed: 'Descadastrado',
  bounced: 'Bounce',
  complained: 'Reclamacao',
  suppressed: 'Suprimido',
};

export const optInStatusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  double_opt_in_pending: 'Dupla confirmacao pendente',
  double_opt_in_confirmed: 'Dupla confirmacao OK',
  unknown: 'Desconhecido',
};

export const campaignStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  sent: 'Enviada',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  failed: 'Falhou',
};

export const recipientStatusLabels: Record<string, string> = {
  queued: 'Na fila',
  sending: 'Enviando',
  sent: 'Enviado',
  failed: 'Falhou',
  skipped: 'Ignorado',
  suppressed: 'Suprimido',
  bounced: 'Bounce',
  unsubscribed: 'Descadastrado',
};

export const roleLabels: Record<string, string> = {
  gerente: 'Gerente',
  operador_marketing: 'Operador de Marketing',
};

export const label = (map: Record<string, string>, key: string): string => map[key] ?? key;
