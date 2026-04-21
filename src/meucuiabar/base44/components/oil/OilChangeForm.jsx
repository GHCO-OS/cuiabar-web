import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Save, X, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

const REASONS = [
  { value: 'programada', label: 'Programada' },
  { value: 'degradacao_visual', label: 'Degradação Visual' },
  { value: 'tempo_uso', label: 'Tempo de Uso' },
  { value: 'odor', label: 'Odor' },
  { value: 'outro', label: 'Outro' },
];

const CONDITIONS = [
  { value: 'claro', label: 'Claro' },
  { value: 'escurecido', label: 'Escurecido' },
  { value: 'muito_escuro', label: 'Muito Escuro' },
  { value: 'espumando', label: 'Espumando' },
];

export default function OilChangeForm({ onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [form, setForm] = useState({
    equipment_id: '',
    responsible: currentUser?.full_name || currentUser?.email || '',
    changed_at: moment().format('YYYY-MM-DDTHH:mm'),
    oil_id: '',
    oil_batch: '',
    volume_liters: '',
    reason: '',
    visual_condition: '',
    observation: '',
    photo_url: '',
  });
  const [uploading, setUploading] = useState(false);

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', selectedUnitId],
    queryFn: () => base44.entities.Equipment.filter({ unit_id: selectedUnitId, active: true }),
    enabled: !!selectedUnitId,
  });

  const fryers = equipment.filter(e => e.type === 'fritadeira');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    await base44.entities.OilChange.create({
      ...form,
      unit_id: selectedUnitId,
      volume_liters: form.volume_liters ? parseFloat(form.volume_liters) : undefined,
    });
    onSave();
  };

  const canSubmit = form.equipment_id && form.responsible && form.reason && form.visual_condition;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Registrar Troca de Óleo</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Fritadeira *</Label>
          <Select value={form.equipment_id} onValueChange={v => setForm({...form, equipment_id: v})}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {fryers.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Motivo da Troca *</Label>
            <Select value={form.reason} onValueChange={v => setForm({...form, reason: v})}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Condição Visual *</Label>
            <Select value={form.visual_condition} onValueChange={v => setForm({...form, visual_condition: v})}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">ID do Óleo</Label>
            <Input value={form.oil_id} onChange={e => setForm({...form, oil_id: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Lote</Label>
            <Input value={form.oil_batch} onChange={e => setForm({...form, oil_batch: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Volume (L)</Label>
            <Input type="number" step="0.1" value={form.volume_liters} onChange={e => setForm({...form, volume_liters: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Responsável *</Label>
            <Input value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Data/Hora</Label>
            <Input type="datetime-local" value={form.changed_at} onChange={e => setForm({...form, changed_at: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Observação</Label>
          <Textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="mt-1" rows={2} />
        </div>

        <div>
          <Label className="text-xs">Foto</Label>
          <div className="mt-1">
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{uploading ? 'Enviando...' : form.photo_url ? 'Foto anexada ✓' : 'Adicionar foto'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit || uploading} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-1.5" />Registrar
        </Button>
      </CardContent>
    </Card>
  );
}