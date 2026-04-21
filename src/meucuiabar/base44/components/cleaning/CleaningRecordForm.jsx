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

export default function CleaningRecordForm({ onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [form, setForm] = useState({
    cleaning_plan_id: '',
    product_used: '',
    dilution: '',
    responsible: currentUser?.full_name || currentUser?.email || '',
    executed_at: moment().format('YYYY-MM-DDTHH:mm'),
    observation: '',
    photo_url: '',
  });
  const [uploading, setUploading] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['cleaningPlans', selectedUnitId],
    queryFn: () => base44.entities.CleaningPlan.filter({ unit_id: selectedUnitId, active: true }),
    enabled: !!selectedUnitId,
  });

  const selectedPlan = plans.find(p => p.id === form.cleaning_plan_id);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    await base44.entities.CleaningRecord.create({
      ...form,
      unit_id: selectedUnitId,
    });
    onSave();
  };

  const canSubmit = form.cleaning_plan_id && form.product_used && form.responsible;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Registrar Limpeza</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Plano de Limpeza *</Label>
          <Select value={form.cleaning_plan_id} onValueChange={v => {
            const plan = plans.find(p => p.id === v);
            setForm({...form, cleaning_plan_id: v, product_used: plan?.product || '', dilution: plan?.dilution || ''});
          }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.area}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Produto *</Label>
            <Input value={form.product_used} onChange={e => setForm({...form, product_used: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Diluição</Label>
            <Input value={form.dilution} onChange={e => setForm({...form, dilution: e.target.value})} className="mt-1" placeholder="Ex: 1:100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Responsável *</Label>
            <Input value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Data/Hora</Label>
            <Input type="datetime-local" value={form.executed_at} onChange={e => setForm({...form, executed_at: e.target.value})} className="mt-1" />
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