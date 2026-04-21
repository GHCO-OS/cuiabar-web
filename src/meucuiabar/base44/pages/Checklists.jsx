import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import ChecklistFillForm from '@meucuiabar/components/checklist/ChecklistFillForm';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Button } from '@meucuiabar/components/ui/button';
import { ClipboardCheck, Play, CheckCircle2 } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

const shiftLabels = { abertura: 'Abertura', almoco: 'Almoço', jantar: 'Jantar', fechamento: 'Fechamento' };

export default function Checklists() {
  const { selectedUnitId } = useUnit();
  const [fillingChecklist, setFillingChecklist] = useState(null);
  const queryClient = useQueryClient();
  const today = moment().format('YYYY-MM-DD');

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.Checklist.filter({ unit_id: selectedUnitId, active: true }) : [],
    enabled: !!selectedUnitId,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['checklistResponses', selectedUnitId, today],
    queryFn: () => selectedUnitId ? base44.entities.ChecklistResponse.filter({ unit_id: selectedUnitId, date: today }) : [],
    enabled: !!selectedUnitId,
  });

  const todayResponseIds = new Set(responses.map(r => `${r.checklist_id}-${r.shift}`));

  const handleSaved = () => {
    setFillingChecklist(null);
    queryClient.invalidateQueries({ queryKey: ['checklistResponses'] });
    queryClient.invalidateQueries({ queryKey: ['nonConformities'] });
  };

  if (fillingChecklist) {
    return (
      <div>
        <ChecklistFillForm checklist={fillingChecklist} onSave={handleSaved} onCancel={() => setFillingChecklist(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Checklists" subtitle={`Checklists do dia — ${moment().format('DD/MM/YYYY')}`} />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : checklists.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nenhum checklist cadastrado" description="Cadastre checklists nas Configurações" />
      ) : (
        <div className="space-y-2.5">
          {checklists.map(c => {
            const filled = todayResponseIds.has(`${c.id}-${c.shift}`);
            return (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        {filled && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{shiftLabels[c.shift] || c.shift}</Badge>
                        <span className="text-[10px] text-muted-foreground">{c.items?.length || 0} itens</span>
                      </div>
                    </div>
                    {!filled ? (
                      <Button size="sm" onClick={() => setFillingChecklist(c)} className="bg-primary hover:bg-primary/90">
                        <Play className="w-3 h-3 mr-1" />Preencher
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Preenchido</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}