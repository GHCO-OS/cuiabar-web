import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';

export default function PlanForm({ open, onClose, onSaved, editPlan }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [form, setForm] = useState(editPlan ? {
    name: editPlan.name,
    product_line: editPlan.product_line || '',
    responsible: editPlan.responsible || '',
    version: editPlan.version || '1.0',
    scope: editPlan.scope || '',
    status: editPlan.status || 'rascunho',
  } : {
    name: '',
    product_line: '',
    responsible: currentUser?.full_name || '',
    version: '1.0',
    scope: '',
    status: 'rascunho',
  });

  const handleSave = async () => {
    const data = { ...form, unit_id: selectedUnitId };
    if (editPlan) {
      await base44.entities.PlanosHACCP.update(editPlan.id, data);
    } else {
      await base44.entities.PlanosHACCP.create(data);
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPlan ? 'Editar' : 'Novo'} Plano HACCP</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Nome do Plano *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ex: HACCP — Cozinha Quente" />
          </div>
          <div>
            <Label className="text-xs">Linha de Produto/Processo</Label>
            <Input value={form.product_line} onChange={e => setForm({ ...form, product_line: e.target.value })} className="mt-1" placeholder="Ex: Preparações quentes, Frios e laticínios" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Responsável Técnico *</Label>
              <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Versão</Label>
              <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="mt-1" placeholder="1.0" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="em_revisao">Em Revisão</SelectItem>
                <SelectItem value="obsoleto">Obsoleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Escopo / Descrição</Label>
            <Textarea value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className="mt-1" rows={3} placeholder="Descreva o escopo do plano HACCP..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name || !form.responsible} onClick={handleSave}>Salvar Plano</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}