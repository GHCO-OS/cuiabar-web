import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Save, X } from 'lucide-react';
import moment from 'moment';

export default function ProduceWashingForm({ onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [form, setForm] = useState({
    item: '',
    batch: '',
    quantity: '',
    product_used: '',
    dilution: '',
    immersion_time_min: '',
    start_time: moment().format('YYYY-MM-DDTHH:mm'),
    end_time: '',
    destination: '',
    responsible: currentUser?.full_name || currentUser?.email || '',
  });

  const handleSubmit = async () => {
    await base44.entities.ProduceWashing.create({
      ...form,
      unit_id: selectedUnitId,
      immersion_time_min: form.immersion_time_min ? parseFloat(form.immersion_time_min) : undefined,
    });
    onSave();
  };

  const canSubmit = form.item && form.product_used && form.responsible && form.start_time;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Registrar Lavagem</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Item *</Label>
            <Input value={form.item} onChange={e => setForm({...form, item: e.target.value})} className="mt-1" placeholder="Ex: Alface" />
          </div>
          <div>
            <Label className="text-xs">Lote</Label>
            <Input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Quantidade</Label>
            <Input value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="mt-1" placeholder="Ex: 5 unidades" />
          </div>
          <div>
            <Label className="text-xs">Destino</Label>
            <Input value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="mt-1" placeholder="Ex: Saladas" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Produto *</Label>
            <Input value={form.product_used} onChange={e => setForm({...form, product_used: e.target.value})} className="mt-1" placeholder="Ex: Hipoclorito" />
          </div>
          <div>
            <Label className="text-xs">Diluição</Label>
            <Input value={form.dilution} onChange={e => setForm({...form, dilution: e.target.value})} className="mt-1" placeholder="200ppm" />
          </div>
          <div>
            <Label className="text-xs">Tempo (min)</Label>
            <Input type="number" value={form.immersion_time_min} onChange={e => setForm({...form, immersion_time_min: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Início *</Label>
            <Input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Término</Label>
            <Input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Responsável *</Label>
          <Input value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="mt-1" />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-1.5" />Registrar
        </Button>
      </CardContent>
    </Card>
  );
}