import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import StatusBadge from '@meucuiabar/components/shared/StatusBadge';
import TemperatureForm from '@meucuiabar/components/temperature/TemperatureForm';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Thermometer } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

export default function Temperatures() {
  const { selectedUnitId } = useUnit();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['tempRecords', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.TemperatureRecord.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const handleSaved = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['tempRecords'] });
    queryClient.invalidateQueries({ queryKey: ['nonConformities'] });
  };

  return (
    <div>
      <PageHeader
        title="Temperaturas"
        subtitle="Registro e controle de temperaturas dos equipamentos"
        onAdd={() => setShowForm(true)}
        addLabel="Registrar"
      />

      {showForm && (
        <div className="mb-6">
          <TemperatureForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={Thermometer}
          title="Nenhum registro de temperatura"
          description="Registre a primeira temperatura para iniciar o controle"
          onAction={() => setShowForm(true)}
          actionLabel="Registrar Temperatura"
        />
      ) : (
        <div className="space-y-2.5">
          {records.map(r => {
            return (
              <Card key={r.id} className={`hover:shadow-sm transition-shadow ${!r.is_conforming ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">{r.equipment_id}</span>
                        <span className={`text-2xl font-bold ${!r.is_conforming ? 'text-red-600' : 'text-foreground'}`}>{r.temperature}°C</span>
                        <StatusBadge status={r.is_conforming ? 'conforme' : 'nao_conforme'} />
                      </div>
                      {r.corrective_action && (
                        <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1">
                          Ação: {r.corrective_action}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground">{moment(r.recorded_at).format('DD/MM HH:mm')}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.responsible}</p>
                    </div>
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