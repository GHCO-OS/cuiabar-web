import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@meucuiabar/components/ui/radio-group';
import { Save, X, Check, XCircle, Minus } from 'lucide-react';
import moment from 'moment';
import { cn } from '@meucuiabar/lib/utils';

export default function ChecklistFillForm({ checklist, onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [responsible, setResponsible] = useState(currentUser?.full_name || currentUser?.email || '');
  const [observation, setObservation] = useState('');
  const [responses, setResponses] = useState(
    (checklist.items || []).map((item, idx) => ({
      item_index: idx,
      description: item.description,
      status: '',
      observation: '',
    }))
  );

  const updateResponse = (idx, field, value) => {
    setResponses(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    const hasNonConforming = responses.some(r => r.status === 'nao_conforme');
    
    await base44.entities.ChecklistResponse.create({
      checklist_id: checklist.id,
      unit_id: selectedUnitId,
      shift: checklist.shift,
      date: moment().format('YYYY-MM-DD'),
      responsible,
      responses,
      observation,
    });

    if (hasNonConforming) {
      const ncItems = responses.filter(r => r.status === 'nao_conforme').map(r => r.description).join(', ');
      await base44.entities.NonConformity.create({
        title: `Checklist: ${checklist.name} — itens não conformes`,
        unit_id: selectedUnitId,
        source: 'checklist',
        severity: 'media',
        description: `Itens não conformes: ${ncItems}`,
        responsible,
        status: 'aberta',
      });
    }

    onSave();
  };

  const allAnswered = responses.every(r => r.status);
  const canSubmit = responsible && allAnswered;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{checklist.name}</CardTitle>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">Turno: {checklist.shift}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Responsável *</Label>
          <Input value={responsible} onChange={e => setResponsible(e.target.value)} className="mt-1" />
        </div>

        <div className="space-y-3">
          {responses.map((r, idx) => (
            <div key={idx} className={cn(
              'p-3 rounded-lg border transition-colors',
              r.status === 'conforme' && 'bg-emerald-50/50 border-emerald-200',
              r.status === 'nao_conforme' && 'bg-red-50/50 border-red-200',
              !r.status && 'bg-muted/30 border-border'
            )}>
              <p className="text-sm font-medium mb-2">{r.description}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant={r.status === 'conforme' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-8 text-xs', r.status === 'conforme' && 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={() => updateResponse(idx, 'status', 'conforme')}
                >
                  <Check className="w-3 h-3 mr-1" />C
                </Button>
                <Button
                  variant={r.status === 'nao_conforme' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-8 text-xs', r.status === 'nao_conforme' && 'bg-red-600 hover:bg-red-700')}
                  onClick={() => updateResponse(idx, 'status', 'nao_conforme')}
                >
                  <XCircle className="w-3 h-3 mr-1" />NC
                </Button>
                <Button
                  variant={r.status === 'nao_aplicavel' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-8 text-xs', r.status === 'nao_aplicavel' && 'bg-gray-600 hover:bg-gray-700')}
                  onClick={() => updateResponse(idx, 'status', 'nao_aplicavel')}
                >
                  <Minus className="w-3 h-3 mr-1" />NA
                </Button>
              </div>
              {r.status === 'nao_conforme' && (
                <Input
                  placeholder="Observação da NC..."
                  value={r.observation}
                  onChange={e => updateResponse(idx, 'observation', e.target.value)}
                  className="mt-2 text-xs"
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs">Observação Geral</Label>
          <Textarea value={observation} onChange={e => setObservation(e.target.value)} className="mt-1" rows={2} />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-1.5" />Enviar Checklist
        </Button>
      </CardContent>
    </Card>
  );
}