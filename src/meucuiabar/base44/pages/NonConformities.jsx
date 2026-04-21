import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import StatusBadge from '@meucuiabar/components/shared/StatusBadge';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Label } from '@meucuiabar/components/ui/label';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

const sourceLabels = {
  temperatura: 'Temperatura', limpeza: 'Limpeza', oleo: 'Óleo',
  hortifruti: 'Hortifruti', checklist: 'Checklist', manual: 'Manual'
};

export default function NonConformities() {
  const { selectedUnitId, isSupervisor } = useUnit();
  const [filter, setFilter] = useState('all');
  const [resolveNC, setResolveNC] = useState(null);
  const [corrAction, setCorrAction] = useState('');
  const queryClient = useQueryClient();

  const { data: ncs = [], isLoading } = useQuery({
    queryKey: ['nonConformities', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.NonConformity.filter({ unit_id: selectedUnitId }, '-created_date', 200) : [],
    enabled: !!selectedUnitId,
  });

  const filtered = ncs.filter(nc => filter === 'all' || nc.status === filter);

  const handleResolve = async () => {
    await base44.entities.NonConformity.update(resolveNC.id, {
      status: 'resolvida',
      corrective_action: corrAction || resolveNC.corrective_action,
      resolved_at: new Date().toISOString(),
    });
    setResolveNC(null);
    setCorrAction('');
    queryClient.invalidateQueries({ queryKey: ['nonConformities'] });
  };

  const handleSetInProgress = async (nc) => {
    await base44.entities.NonConformity.update(nc.id, { status: 'em_andamento' });
    queryClient.invalidateQueries({ queryKey: ['nonConformities'] });
  };

  return (
    <div>
      <PageHeader title="Não Conformidades" subtitle="Acompanhamento e resolução">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="aberta">Abertas</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="resolvida">Resolvidas</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Nenhuma não conformidade" description={filter !== 'all' ? 'Nenhum registro com esse filtro' : 'Excelente! Tudo em conformidade'} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(nc => (
            <Card key={nc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{nc.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <StatusBadge status={nc.severity} />
                      <StatusBadge status={nc.status} />
                      <span className="text-[10px] text-muted-foreground">{sourceLabels[nc.source] || nc.source}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{nc.description}</p>
                    {nc.corrective_action && (
                      <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 rounded px-2 py-1">
                        Ação: {nc.corrective_action}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-muted-foreground">{moment(nc.created_date).format('DD/MM HH:mm')}</p>
                    {isSupervisor && nc.status === 'aberta' && (
                      <div className="flex flex-col gap-1 mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleSetInProgress(nc)}>
                          Em Andamento
                        </Button>
                        <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => { setResolveNC(nc); setCorrAction(nc.corrective_action || ''); }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />Resolver
                        </Button>
                      </div>
                    )}
                    {isSupervisor && nc.status === 'em_andamento' && (
                      <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 mt-2" onClick={() => { setResolveNC(nc); setCorrAction(nc.corrective_action || ''); }}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!resolveNC} onOpenChange={() => setResolveNC(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Não Conformidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{resolveNC?.title}</p>
            <div>
              <Label className="text-xs">Ação Corretiva</Label>
              <Textarea value={corrAction} onChange={e => setCorrAction(e.target.value)} className="mt-1" rows={3} placeholder="Descreva a ação corretiva..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveNC(null)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleResolve}>Confirmar Resolução</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}