import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Badge } from '@meucuiabar/components/ui/badge';
import { AlertTriangle, CheckCircle2, Save, X } from 'lucide-react';
import moment from 'moment';

export default function MonitorForm({ pccs = [], onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [selectedPccId, setSelectedPccId] = useState('');
  const [form, setForm] = useState({
    value: '',
    responsible: currentUser?.full_name || currentUser?.email || '',
    monitored_at: moment().format('YYYY-MM-DDTHH:mm'),
    observation: '',
    corrective_action: '',
  });

  const selectedPcc = pccs.find(p => p.id === selectedPccId);

  const value = parseFloat(form.value);
  const isOutOfRange = selectedPcc && !isNaN(value) && form.value !== '' && (
    (selectedPcc.critical_limit_min != null && value < selectedPcc.critical_limit_min) ||
    (selectedPcc.critical_limit_max != null && value > selectedPcc.critical_limit_max)
  );

  const handleSubmit = async () => {
    const isConforming = !isOutOfRange;
    await base44.entities.MonitoramentosPCC.create({
      pcc_id: selectedPccId,
      plano_id: selectedPcc.plano_id,
      unit_id: selectedUnitId,
      value,
      unit_measure: selectedPcc.limit_unit || '',
      is_conforming: isConforming,
      corrective_action: form.corrective_action,
      responsible: form.responsible,
      monitored_at: new Date(form.monitored_at).toISOString(),
      observation: form.observation,
      source_type: 'manual',
    });

    if (!isConforming) {
      await base44.entities.NonConformity.create({
        title: `PCC em desvio — ${selectedPcc.number}: ${selectedPcc.name}`,
        unit_id: selectedUnitId,
        source: 'checklist',
        severity: 'critica',
        description: `PCC ${selectedPcc.number} com valor ${value} ${selectedPcc.limit_unit || ''}. Limite: ${selectedPcc.critical_limit_min ?? '?'} a ${selectedPcc.critical_limit_max ?? '?'} ${selectedPcc.limit_unit || ''}. Ação: ${form.corrective_action}`,
        corrective_action: form.corrective_action,
        responsible: form.responsible,
        status: 'aberta',
      });
    }
    onSave();
  };

  const canSubmit = selectedPccId && form.value !== '' && form.responsible && (!isOutOfRange || form.corrective_action);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Monitorar PCC</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">PCC *</Label>
          <Select value={selectedPccId} onValueChange={setSelectedPccId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o PCC" /></SelectTrigger>
            <SelectContent>
              {pccs.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.number} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPcc && (
            <div className="mt-2 p-2.5 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium">{selectedPcc.description}</p>
              <p className="text-muted-foreground mt-0.5">
                Limite crítico: {selectedPcc.critical_limit_min ?? '–'} a {selectedPcc.critical_limit_max ?? '–'} {selectedPcc.limit_unit}
              </p>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs">Valor Medido * {selectedPcc?.limit_unit && `(${selectedPcc.limit_unit})`}</Label>
          <Input
            type="number"
            step="0.1"
            value={form.value}
            onChange={e => setForm({ ...form, value: e.target.value })}
            className="mt-1"
            disabled={!selectedPccId}
          />
          {selectedPcc && form.value !== '' && !isNaN(value) && (
            <div className={`flex items-center gap-2 mt-2 p-2.5 rounded-lg border ${isOutOfRange ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {isOutOfRange
                ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <p className={`text-xs font-medium ${isOutOfRange ? 'text-red-700' : 'text-emerald-700'}`}>
                {isOutOfRange ? 'LIMITE CRÍTICO VIOLADO — Ação corretiva obrigatória!' : 'Dentro do limite crítico'}
              </p>
            </div>
          )}
        </div>

        {isOutOfRange && (
          <div>
            <Label className="text-xs text-red-600 font-semibold">Ação Corretiva * (obrigatória)</Label>
            <Textarea value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} className="mt-1 border-red-300" rows={3}
              placeholder={selectedPcc?.corrective_action || 'Descreva a ação corretiva...'} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Responsável *</Label>
            <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Data/Hora</Label>
            <Input type="datetime-local" value={form.monitored_at} onChange={e => setForm({ ...form, monitored_at: e.target.value })} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Observação</Label>
          <Textarea value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} className="mt-1" rows={2} />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-1.5" />Registrar Monitoramento
        </Button>
      </CardContent>
    </Card>
  );
}