import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';

export default function PCCForm({ open, onClose, onSaved, editPcc, planoId, etapas = [] }) {
  const { selectedUnitId } = useUnit();
  const [form, setForm] = useState(editPcc ? {
    name: editPcc.name,
    number: editPcc.number || '',
    etapa_id: editPcc.etapa_id || '',
    description: editPcc.description || '',
    hazard_type: editPcc.hazard_type || 'biologico',
    critical_limit_min: editPcc.critical_limit_min?.toString() || '',
    critical_limit_max: editPcc.critical_limit_max?.toString() || '',
    limit_unit: editPcc.limit_unit || '°C',
    monitoring_frequency: editPcc.monitoring_frequency || '',
    monitoring_method: editPcc.monitoring_method || '',
    corrective_action: editPcc.corrective_action || '',
    responsible_monitoring: editPcc.responsible_monitoring || '',
    responsible_verification: editPcc.responsible_verification || '',
    records_required: editPcc.records_required || '',
  } : {
    name: '',
    number: '',
    etapa_id: '',
    description: '',
    hazard_type: 'biologico',
    critical_limit_min: '',
    critical_limit_max: '',
    limit_unit: '°C',
    monitoring_frequency: '',
    monitoring_method: '',
    corrective_action: '',
    responsible_monitoring: '',
    responsible_verification: '',
    records_required: '',
  });

  const handleSave = async () => {
    const data = {
      ...form,
      plano_id: planoId,
      unit_id: selectedUnitId,
      critical_limit_min: form.critical_limit_min !== '' ? parseFloat(form.critical_limit_min) : undefined,
      critical_limit_max: form.critical_limit_max !== '' ? parseFloat(form.critical_limit_max) : undefined,
      active: true,
    };
    if (editPcc) {
      await base44.entities.PCCs.update(editPcc.id, data);
    } else {
      await base44.entities.PCCs.create(data);
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPcc ? 'Editar' : 'Novo'} PCC — Ponto Crítico de Controle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Número do PCC *</Label>
              <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="mt-1" placeholder="Ex: PCC-01" />
            </div>
            <div>
              <Label className="text-xs">Tipo de Perigo</Label>
              <Select value={form.hazard_type} onValueChange={v => setForm({ ...form, hazard_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="biologico">Biológico</SelectItem>
                  <SelectItem value="quimico">Químico</SelectItem>
                  <SelectItem value="fisico">Físico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Nome do PCC *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ex: Temperatura de armazenamento refrigerado" />
          </div>
          {etapas.length > 0 && (
            <div>
              <Label className="text-xs">Etapa do Processo</Label>
              <Select value={form.etapa_id} onValueChange={v => setForm({ ...form, etapa_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                <SelectContent>
                  {etapas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.step_number}. {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Descrição do PCC</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} placeholder="Descreva o que está sendo controlado..." />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-2">Limites Críticos</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">Mínimo</Label>
                <Input type="number" step="0.1" value={form.critical_limit_min} onChange={e => setForm({ ...form, critical_limit_min: e.target.value })} className="mt-1" placeholder="-25" />
              </div>
              <div>
                <Label className="text-[10px]">Máximo</Label>
                <Input type="number" step="0.1" value={form.critical_limit_max} onChange={e => setForm({ ...form, critical_limit_max: e.target.value })} className="mt-1" placeholder="6" />
              </div>
              <div>
                <Label className="text-[10px]">Unidade</Label>
                <Input value={form.limit_unit} onChange={e => setForm({ ...form, limit_unit: e.target.value })} className="mt-1" placeholder="°C" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frequência de Monitoramento</Label>
              <Input value={form.monitoring_frequency} onChange={e => setForm({ ...form, monitoring_frequency: e.target.value })} className="mt-1" placeholder="Ex: 2x ao dia" />
            </div>
            <div>
              <Label className="text-xs">Método</Label>
              <Input value={form.monitoring_method} onChange={e => setForm({ ...form, monitoring_method: e.target.value })} className="mt-1" placeholder="Ex: Termômetro digital" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Ação Corretiva Padrão</Label>
            <Textarea value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} className="mt-1" rows={2} placeholder="O que fazer quando o limite é violado..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Resp. Monitoramento</Label>
              <Input value={form.responsible_monitoring} onChange={e => setForm({ ...form, responsible_monitoring: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Resp. Verificação</Label>
              <Input value={form.responsible_verification} onChange={e => setForm({ ...form, responsible_verification: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name || !form.number} onClick={handleSave}>Salvar PCC</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}