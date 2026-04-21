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
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';

const FREQUENCIES = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
];

export default function CleaningPlanManager() {
  const { selectedUnitId } = useUnit();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', area: '', frequency: '', product: '', dilution: '', instructions: '' });
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['cleaningPlans', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningPlan.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const handleSave = async () => {
    const data = { ...form, unit_id: selectedUnitId, active: true };
    if (editId) {
      await base44.entities.CleaningPlan.update(editId, data);
    } else {
      await base44.entities.CleaningPlan.create(data);
    }
    setShowDialog(false);
    setForm({ name: '', area: '', frequency: '', product: '', dilution: '', instructions: '' });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['cleaningPlans'] });
  };

  const startEdit = (p) => {
    setForm({ name: p.name, area: p.area, frequency: p.frequency, product: p.product || '', dilution: p.dilution || '', instructions: p.instructions || '' });
    setEditId(p.id);
    setShowDialog(true);
  };

  const freqLabels = Object.fromEntries(FREQUENCIES.map(f => [f.value, f.label]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Planos de Limpeza</h3>
        <Button size="sm" variant="outline" onClick={() => { setForm({ name: '', area: '', frequency: '', product: '', dilution: '', instructions: '' }); setEditId(null); setShowDialog(true); }}>
          <Plus className="w-3 h-3 mr-1" />Novo
        </Button>
      </div>
      <div className="space-y-2">
        {plans.map(p => (
          <Card key={p.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.area}</span>
                  <Badge variant="outline" className="text-[10px]">{freqLabels[p.frequency] || p.frequency}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(p)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Plano de Limpeza</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs">Área/Equipamento *</Label><Input value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Frequência *</Label>
              <Select value={form.frequency} onValueChange={v => setForm({...form, frequency: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Produto</Label><Input value={form.product} onChange={e => setForm({...form, product: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs">Diluição</Label><Input value={form.dilution} onChange={e => setForm({...form, dilution: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Instruções</Label><Textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button disabled={!form.name || !form.area || !form.frequency} onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}