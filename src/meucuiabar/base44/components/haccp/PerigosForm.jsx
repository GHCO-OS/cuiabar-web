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

export default function PerigosForm({ open, onClose, onSaved, planoId, etapaId }) {
  const { selectedUnitId } = useUnit();
  const [form, setForm] = useState({
    type: 'biologico',
    description: '',
    cause: '',
    preventive_measures: '',
    severity: 'media',
    probability: 'media',
    is_significant: false,
    justification: '',
  });

  const handleSave = async () => {
    await base44.entities.PerigosProcesso.create({
      ...form,
      etapa_id: etapaId,
      plano_id: planoId,
      unit_id: selectedUnitId,
    });
    onSaved();
    onClose();
    setForm({ type: 'biologico', description: '', cause: '', preventive_measures: '', severity: 'media', probability: 'media', is_significant: false, justification: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Identificar Perigo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Tipo de Perigo *</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="biologico">🦠 Biológico</SelectItem>
                <SelectItem value="quimico">⚗️ Químico</SelectItem>
                <SelectItem value="fisico">🔩 Físico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição do Perigo *</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" placeholder="Ex: Contaminação por Salmonella, Resíduos de detergente..." />
          </div>
          <div>
            <Label className="text-xs">Causa Potencial</Label>
            <Input value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className="mt-1" placeholder="Ex: Temperatura inadequada, falta de higienização..." />
          </div>
          <div>
            <Label className="text-xs">Medidas Preventivas</Label>
            <Textarea value={form.preventive_measures} onChange={e => setForm({ ...form, preventive_measures: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Gravidade</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Probabilidade</Label>
              <Select value={form.probability} onValueChange={v => setForm({ ...form, probability: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch checked={form.is_significant} onCheckedChange={v => setForm({ ...form, is_significant: v })} />
            <Label className="text-xs cursor-pointer font-semibold">Perigo Significativo (requer PCC ou PPR)</Label>
          </div>
          {form.is_significant && (
            <div>
              <Label className="text-xs">Justificativa da Decisão</Label>
              <Textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} className="mt-1" rows={2} placeholder="Justifique a classificação como perigo significativo..." />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.description} onClick={handleSave}>Salvar Perigo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}