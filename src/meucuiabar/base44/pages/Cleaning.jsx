import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import CleaningRecordForm from '@meucuiabar/components/cleaning/CleaningRecordForm';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@meucuiabar/components/ui/tabs';
import { SprayCanIcon, Image } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

export default function Cleaning() {
  const { selectedUnitId } = useUnit();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['cleaningRecords', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningRecord.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['cleaningPlans', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningPlan.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

  const handleSaved = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['cleaningRecords'] });
  };

  return (
    <div>
      <PageHeader title="Limpeza" subtitle="Planos e registros de limpeza" onAdd={() => setShowForm(true)} addLabel="Registrar" />

      {showForm && (
        <div className="mb-6">
          <CleaningRecordForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <Tabs defaultValue="records">
        <TabsList className="mb-4">
          <TabsTrigger value="records">Registros</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : records.length === 0 ? (
            <EmptyState icon={SprayCanIcon} title="Nenhum registro de limpeza" onAction={() => setShowForm(true)} actionLabel="Registrar Limpeza" />
          ) : (
            <div className="space-y-2.5">
              {records.map(r => {
                const plan = planMap[r.cleaning_plan_id];
                return (
                  <Card key={r.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{plan?.name || 'Limpeza'}</p>
                          <p className="text-xs text-muted-foreground">{plan?.area}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span>Produto: {r.product_used}</span>
                            {r.dilution && <span>Diluição: {r.dilution}</span>}
                          </div>
                          {r.photo_url && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <Image className="w-3 h-3" />Foto anexada
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs text-muted-foreground">{moment(r.executed_at).format('DD/MM HH:mm')}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.responsible}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans">
          {plans.length === 0 ? (
            <EmptyState icon={SprayCanIcon} title="Nenhum plano de limpeza" description="Cadastre planos nas Configurações" />
          ) : (
            <div className="space-y-2.5">
              {plans.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.area} — {p.frequency}</p>
                    {p.product && <p className="text-xs text-muted-foreground mt-1">Produto: {p.product} {p.dilution && `(${p.dilution})`}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}