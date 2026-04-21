import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Label } from '@meucuiabar/components/ui/label';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';

const TYPES = [
  { value: 'geladeira', label: 'Geladeira' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'camara_fria', label: 'Câmara Fria' },
  { value: 'balcao_refrigerado', label: 'Balcão Refrigerado' },
  { value: 'fritadeira', label: 'Fritadeira' },
  { value: 'estufa', label: 'Estufa' },
  { value: 'banho_maria', label: 'Banho Maria' },
  { value: 'outro', label: 'Outro' },
];

export default function EquipmentManager() {
  const { selectedUnitId } = useUnit();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', type: '', temp_min: '', temp_max: '', oil_change_interval_hours: '' });
  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.Equipment.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const handleSave = async () => {
    const data = {
      name: form.name,
      type: form.type,
      unit_id: selectedUnitId,
      temp_min: form.temp_min ? parseFloat(form.temp_min) : undefined,
      temp_max: form.temp_max ? parseFloat(form.temp_max) : undefined,
      oil_change_interval_hours: form.oil_change_interval_hours ? parseFloat(form.oil_change_interval_hours) : undefined,
      active: true,
    };
    if (editId) {
      await base44.entities.Equipment.update(editId, data);
    } else {
      await base44.entities.Equipment.create(data);
    }
    setShowDialog(false);
    setForm({ name: '', type: '', temp_min: '', temp_max: '', oil_change_interval_hours: '' });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['equipment'] });
  };

  const startEdit = (e) => {
    setForm({
      name: e.name, type: e.type,
      temp_min: e.temp_min?.toString() || '',
      temp_max: e.temp_max?.toString() || '',
      oil_change_interval_hours: e.oil_change_interval_hours?.toString() || '',
    });
    setEditId(e.id);
    setShowDialog(true);
  };

  const typeLabels = Object.fromEntries(TYPES.map(t => [t.value, t.label]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Equipamentos</h3>
        <Button size="sm" variant="outline" onClick={() => { setForm({ name: '', type: '', temp_min: '', temp_max: '', oil_change_interval_hours: '' }); setEditId(null); setShowDialog(true); }}>
          <Plus className="w-3 h-3 mr-1" />Novo
        </Button>
      </div>
      <div className="space-y-2">
        {equipment.map(e => (
          <Card key={e.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{e.name}</p>
                  <Badge variant="outline" className="text-[10px]">{typeLabels[e.type] || e.type}</Badge>
                </div>
                <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  {(e.temp_min != null || e.temp_max != null) && <span>Faixa: {e.temp_min}°C a {e.temp_max}°C</span>}
                  {e.oil_change_interval_hours && <span>Troca óleo: {e.oil_change_interval_hours}h</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(e)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Equipamento</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Temp. Mín (°C)</Label><Input type="number" step="0.1" value={form.temp_min} onChange={e => setForm({...form, temp_min: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs">Temp. Máx (°C)</Label><Input type="number" step="0.1" value={form.temp_max} onChange={e => setForm({...form, temp_max: e.target.value})} className="mt-1" /></div>
            </div>
            {form.type === 'fritadeira' && (
              <div><Label className="text-xs">Intervalo troca óleo (horas)</Label><Input type="number" value={form.oil_change_interval_hours} onChange={e => setForm({...form, oil_change_interval_hours: e.target.value})} className="mt-1" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button disabled={!form.name || !form.type} onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}