import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Textarea } from '@meucuiabar/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Badge } from '@meucuiabar/components/ui/badge';
import { AlertTriangle, Save, X, CheckCircle2, Thermometer } from 'lucide-react';
import moment from 'moment';

const DEFAULT_RANGES = {
  G: { min: 0, max: 6, label: 'Geladeira' },
  C: { min: -25, max: -14, label: 'Congelador' },
  R: { min: -6, max: 0, label: 'Refrigerador' },
};

const EQUIP_CODE_REGEX = /^[GCR][0-9]$/;

export default function TemperatureForm({ onSave, onCancel }) {
  const { selectedUnitId, currentUser } = useUnit();
  const [equipCode, setEquipCode] = useState('');
  const [form, setForm] = useState({
    temperature: '',
    corrective_action: '',
    observation: '',
    responsible: currentUser?.full_name || currentUser?.email || '',
    recorded_at: moment().format('YYYY-MM-DDTHH:mm'),
  });

  const { data: typeConfigs = [] } = useQuery({
    queryKey: ['equipTypeConfigs', selectedUnitId],
    queryFn: () => base44.entities.EquipmentTypeConfig.filter({ unit_id: selectedUnitId }),
    enabled: !!selectedUnitId,
  });

  const handleCodeChange = (val) => {
    setEquipCode(val.toUpperCase().slice(0, 2));
  };

  const isValidCode = EQUIP_CODE_REGEX.test(equipCode);
  const equipType = isValidCode ? equipCode[0] : null;

  const getRange = () => {
    if (!equipType) return null;
    const config = typeConfigs.find(c => c.equipment_type === equipType);
    if (config) return { min: config.temp_min, max: config.temp_max, label: DEFAULT_RANGES[equipType]?.label };
    return { ...DEFAULT_RANGES[equipType] };
  };

  const range = getRange();
  const temp = parseFloat(form.temperature);
  const isOutOfRange = range && !isNaN(temp) && form.temperature !== '' && (temp < range.min || temp > range.max);

  const handleSubmit = async () => {
    const isConforming = !isOutOfRange;
    await base44.entities.TemperatureRecord.create({
      equipment_id: equipCode,
      unit_id: selectedUnitId,
      temperature: temp,
      is_conforming: isConforming,
      corrective_action: form.corrective_action,
      observation: form.observation,
      responsible: form.responsible,
      recorded_at: new Date(form.recorded_at).toISOString(),
    });

    if (!isConforming) {
      const deviation = temp > range.max ? temp - range.max : range.min - temp;
      const severity = deviation > 10 ? 'critica' : deviation > 5 ? 'alta' : 'media';
      await base44.entities.NonConformity.create({
        title: `Temp. fora da faixa — ${equipCode} (${range?.label})`,
        unit_id: selectedUnitId,
        source: 'temperatura',
        severity,
        description: `Equipamento ${equipCode} (${range?.label}). Temperatura: ${temp}°C. Faixa: ${range?.min}°C a ${range?.max}°C. Ação: ${form.corrective_action}`,
        corrective_action: form.corrective_action,
        responsible: form.responsible,
        status: 'aberta',
      });
    }
    onSave();
  };

  const canSubmit = isValidCode && form.temperature !== '' && form.responsible && (!isOutOfRange || form.corrective_action);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            Registrar Temperatura
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Código do Equipamento *</Label>
          <div className="flex gap-2 mt-1 items-start">
            <div className="flex-1">
              <Input
                value={equipCode}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="Ex: G1, C1, R1"
                className={`font-mono text-lg tracking-widest ${equipCode && !isValidCode ? 'border-red-400 focus:ring-red-400' : ''}`}
                maxLength={2}
              />
              {equipCode && !isValidCode && (
                <p className="text-[10px] text-red-500 mt-1">
                  Formato inválido. Use G, C ou R seguido de número (ex: G1, C2, R1)
                </p>
              )}
            </div>
            {isValidCode && range && (
              <div className="bg-muted border rounded-lg px-3 py-2 text-xs min-w-[130px] shrink-0">
                <p className="font-semibold text-foreground">{range.label}</p>
                <p className="text-muted-foreground mt-0.5">Faixa: {range.min}°C a {range.max}°C</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px] h-5">G = Geladeira (0 ~ 6°C)</Badge>
            <Badge variant="outline" className="text-[10px] h-5">C = Congelador (até -25°C)</Badge>
            <Badge variant="outline" className="text-[10px] h-5">R = Refrigerador (até -6°C)</Badge>
          </div>
        </div>

        <div>
          <Label className="text-xs">Temperatura (°C) *</Label>
          <Input
            type="number"
            step="0.1"
            value={form.temperature}
            onChange={e => setForm({ ...form, temperature: e.target.value })}
            className="mt-1"
            placeholder={isValidCode ? `Ex: ${range?.min}` : 'Informe o código primeiro'}
            disabled={!isValidCode}
          />
          {isValidCode && range && form.temperature !== '' && !isNaN(temp) && (
            <div className={`flex items-center gap-2 mt-2 p-2.5 rounded-lg border ${isOutOfRange ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {isOutOfRange
                ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <p className={`text-xs ${isOutOfRange ? 'text-red-700' : 'text-emerald-700'}`}>
                {isOutOfRange
                  ? `NÃO CONFORME — Faixa esperada: ${range.min}°C a ${range.max}°C`
                  : `Conforme — dentro da faixa ${range.min}°C a ${range.max}°C`}
              </p>
            </div>
          )}
        </div>

        {isOutOfRange && (
          <div>
            <Label className="text-xs text-red-600 font-semibold">⚠ Ação Corretiva (obrigatória)</Label>
            <Textarea
              value={form.corrective_action}
              onChange={e => setForm({ ...form, corrective_action: e.target.value })}
              className="mt-1 border-red-300 focus:ring-red-400"
              placeholder="Descreva a ação corretiva tomada imediatamente..."
              rows={3}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Responsável *</Label>
            <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Data/Hora</Label>
            <Input type="datetime-local" value={form.recorded_at} onChange={e => setForm({ ...form, recorded_at: e.target.value })} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Observação</Label>
          <Textarea value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} className="mt-1" rows={2} />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-1.5" />
          Registrar Temperatura
        </Button>
      </CardContent>
    </Card>
  );
}