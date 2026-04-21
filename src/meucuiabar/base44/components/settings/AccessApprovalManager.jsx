import { useQuery, useQueryClient } from '@tanstack/react-query';
import { crmRequest } from '@/meucuiabar/api';
import { useMeuCuiabarSession } from '@/meucuiabar/context';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Badge } from '@meucuiabar/components/ui/badge';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

export default function AccessApprovalManager() {
  const queryClient = useQueryClient();
  const { csrfToken } = useMeuCuiabarSession();

  const { data, isLoading } = useQuery({
    queryKey: ['meucuiabar-access-requests'],
    queryFn: () => crmRequest('/api/meucuiabar/access-requests'),
  });

  const requests = data?.requests ?? [];

  const approveRequest = async (requestId) => {
    await crmRequest(`/api/meucuiabar/access-requests/${requestId}/approve`, { method: 'POST' }, csrfToken);
    await queryClient.invalidateQueries({ queryKey: ['meucuiabar-access-requests'] });
  };

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Carregando solicitacoes...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma solicitacao pendente de aprovacao no momento.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{request.displayName || request.email}</p>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {request.approvalStatus}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {request.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {request.requestedAt ? new Date(request.requestedAt).toLocaleString('pt-BR') : 'sem horario registrado'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {request.scope.map((scope) => (
                  <Badge key={scope} variant="secondary" className="text-[10px]">
                    {scope.replace('https://www.googleapis.com/auth/', '')}
                  </Badge>
                ))}
              </div>
            </div>

            <Button className="shrink-0" onClick={() => approveRequest(request.id)}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Aprovar acesso
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
