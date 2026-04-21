import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import ProduceWashingForm from '@meucuiabar/components/produce/ProduceWashingForm';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Salad } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

export default function ProduceWashing() {
  const { selectedUnitId } = useUnit();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['produceWashings', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.ProduceWashing.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const handleSaved = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['produceWashings'] });
  };

  return (
    <div>
      <PageHeader title="Lavagem de Hortifruti" subtitle="Registro de sanitização de frutas e verduras" onAdd={() => setShowForm(true)} addLabel="Registrar" />

      {showForm && (
        <div className="mb-6">
          <ProduceWashingForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : records.length === 0 ? (
        <EmptyState icon={Salad} title="Nenhuma lavagem registrada" onAction={() => setShowForm(true)} actionLabel="Registrar Lavagem" />
      ) : (
        <div className="space-y-2.5">
          {records.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.item}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">{r.product_used}</Badge>
                      {r.dilution && <Badge variant="outline" className="text-[10px]">{r.dilution}</Badge>}
                      {r.immersion_time_min && <Badge variant="outline" className="text-[10px]">{r.immersion_time_min} min</Badge>}
                      {r.destination && <Badge variant="outline" className="text-[10px]">→ {r.destination}</Badge>}
                    </div>
                    {r.batch && <p className="text-[10px] text-muted-foreground mt-1">Lote: {r.batch} {r.quantity && `| Qtd: ${r.quantity}`}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs text-muted-foreground">{moment(r.start_time).format('DD/MM HH:mm')}</p>
                    {r.end_time && <p className="text-[10px] text-muted-foreground">até {moment(r.end_time).format('HH:mm')}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.responsible}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}