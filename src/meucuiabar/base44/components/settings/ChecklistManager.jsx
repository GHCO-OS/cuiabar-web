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
import { Plus, Pencil, X, ListPlus } from 'lucide-react';

const SHIFTS = [
  { value: 'abertura', label: 'Abertura' },
  { value: 'almoco', label: 'Almoço' },
  { value: 'jantar', label: 'Jantar' },
  { value: 'fechamento', label: 'Fechamento' },
];

export default function ChecklistManager() {
  const { selectedUnitId } = useUnit();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', shift: '', items: [] });
  const [newItem, setNewItem] = useState('');
  const queryClient = useQueryClient();

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.Checklist.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const addItem = () => {
    if (!newItem.trim()) return;
    setForm(prev => ({ ...prev, items: [...prev.items, { description: newItem.trim() }] }));
    setNewItem('');
  };

  const removeItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    const data = { ...form, unit_id: selectedUnitId, active: true };
    if (editId) {
      await base44.entities.Checklist.update(editId, data);
    } else {
      await base44.entities.Checklist.create(data);
    }
    setShowDialog(false);
    setForm({ name: '', shift: '', items: [] });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['checklists'] });
  };

  const startEdit = (c) => {
    setForm({ name: c.name, shift: c.shift, items: c.items || [] });
    setEditId(c.id);
    setShowDialog(true);
  };

  const shiftLabels = Object.fromEntries(SHIFTS.map(s => [s.value, s.label]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Checklists</h3>
        <Button size="sm" variant="outline" onClick={() => { setForm({ name: '', shift: '', items: [] }); setEditId(null); setShowDialog(true); }}>
          <Plus className="w-3 h-3 mr-1" />Novo
        </Button>
      </div>
      <div className="space-y-2">
        {checklists.map(c => (
          <Card key={c.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{shiftLabels[c.shift] || c.shift}</Badge>
                  <span className="text-[10px] text-muted-foreground">{c.items?.length || 0} itens</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Checklist</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Turno *</Label>
              <Select value={form.shift} onValueChange={v => setForm({...form, shift: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Itens do Checklist</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Descrição do item..." onKeyDown={e => e.key === 'Enter' && addItem()} />
                <Button size="sm" variant="outline" onClick={addItem}><ListPlus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1.5 mt-3">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <span className="text-sm flex-1">{item.description}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button disabled={!form.name || !form.shift || form.items.length === 0} onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}