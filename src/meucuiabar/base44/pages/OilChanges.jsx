import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import EmptyState from '@meucuiabar/components/shared/EmptyState';
import StatusBadge from '@meucuiabar/components/shared/StatusBadge';
import OilChangeForm from '@meucuiabar/components/oil/OilChangeForm';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Droplets, AlertTriangle, Image } from 'lucide-react';
import moment from 'moment';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';

export default function OilChanges() {
  const { selectedUnitId } = useUnit();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['oilChanges', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.OilChange.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.Equipment.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const equipMap = Object.fromEntries(equipment.map(e => [e.id, e]));
  const fryers = equipment.filter(e => e.type === 'fritadeira');

  // Check for overdue oil changes
  const getLastChange = (equipId) => {
    return records.find(r => r.equipment_id === equipId);
  };

  const overdueAlerts = fryers.filter(f => {
    if (!f.oil_change_interval_hours) return false;
    const last = getLastChange(f.id);
    if (!last) return true;
    const hoursSince = moment().diff(moment(last.changed_at), 'hours');
    return hoursSince > f.oil_change_interval_hours;
  });

  const handleSaved = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['oilChanges'] });
  };

  const conditionLabels = { claro: 'Claro', escurecido: 'Escurecido', muito_escuro: 'Muito Escuro', espumando: 'Espumando' };
  const reasonLabels = { programada: 'Programada', degradacao_visual: 'Degradação Visual', tempo_uso: 'Tempo de Uso', odor: 'Odor', outro: 'Outro' };

  return (
    <div>
      <PageHeader title="Troca de Óleo" subtitle="Registro de trocas de óleo das fritadeiras" onAdd={() => setShowForm(true)} addLabel="Registrar" />

      {overdueAlerts.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700">Trocas em atraso!</p>
          </div>
          {overdueAlerts.map(f => (
            <p key={f.id} className="text-xs text-red-600 ml-6">• {f.name} — intervalo: {f.oil_change_interval_hours}h</p>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <OilChangeForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : records.length === 0 ? (
        <EmptyState icon={Droplets} title="Nenhuma troca de óleo" onAction={() => setShowForm(true)} actionLabel="Registrar Troca" />
      ) : (
        <div className="space-y-2.5">
          {records.map(r => {
            const equip = equipMap[r.equipment_id];
            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{equip?.name || 'Fritadeira'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{reasonLabels[r.reason] || r.reason}</Badge>
                        <Badge variant="outline" className="text-[10px]">{conditionLabels[r.visual_condition] || r.visual_condition}</Badge>
                        {r.volume_liters && <Badge variant="outline" className="text-[10px]">{r.volume_liters}L</Badge>}
                      </div>
                      {r.photo_url && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                          <Image className="w-3 h-3" />Foto
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground">{moment(r.changed_at).format('DD/MM HH:mm')}</p>
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