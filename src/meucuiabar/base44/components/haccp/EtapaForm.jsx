import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Switch } from '@meucuiabar/components/ui/switch';

export default function EtapaForm({ open, onClose, onSaved, planoId, nextStep }) {
  const { selectedUnitId } = useUnit();
  const [form, setForm] = useState({
    step_number: nextStep || 1,
    name: '',
    description: '',
    is_pcc: false,
    is_ppr: false,
  });

  const handleSave = async () => {
    await base44.entities.EtapasProcesso.create({
      ...form,
      plano_id: planoId,
      unit_id: selectedUnitId,
    });
    onSaved();
    onClose();
    setForm({ step_number: nextStep || 1, name: '', description: '', is_pcc: false, is_ppr: false });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Etapa do Processo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Nº Etapa *</Label>
              <Input type="number" value={form.step_number} onChange={e => setForm({ ...form, step_number: parseInt(e.target.value) })} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Nome da Etapa *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ex: Recebimento, Armazenamento, Preparo..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="flex gap-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_pcc} onCheckedChange={v => setForm({ ...form, is_pcc: v, is_ppr: v ? false : form.is_ppr })} />
              <Label className="text-xs cursor-pointer">É um PCC</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_ppr} onCheckedChange={v => setForm({ ...form, is_ppr: v, is_pcc: v ? false : form.is_pcc })} />
              <Label className="text-xs cursor-pointer">É um PPR</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name} onClick={handleSave}>Salvar Etapa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}