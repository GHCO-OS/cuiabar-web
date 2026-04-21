import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@meucuiabar/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Thermometer, AlertTriangle, SprayCanIcon, Droplets, Filter, Download } from 'lucide-react';
import moment from 'moment';
import ParecerPDF from '@meucuiabar/components/relatorios/ParecerPDF';

const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function Relatorios() {
  const { selectedUnitId } = useUnit();
  const [dateFrom, setDateFrom] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(moment().format('YYYY-MM-DD'));
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterEquip, setFilterEquip] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: tempRecords = [] } = useQuery({
    queryKey: ['reportTemps', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.TemperatureRecord.filter({ unit_id: selectedUnitId }, '-recorded_at', 500) : [],
    enabled: !!selectedUnitId,
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ['reportNCs', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.NonConformity.filter({ unit_id: selectedUnitId }, '-created_date', 500) : [],
    enabled: !!selectedUnitId,
  });

  const { data: cleaningRecords = [] } = useQuery({
    queryKey: ['reportCleaning', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningRecord.filter({ unit_id: selectedUnitId }, '-executed_at', 200) : [],
    enabled: !!selectedUnitId,
  });

  const { data: oilChanges = [] } = useQuery({
    queryKey: ['reportOil', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.OilChange.filter({ unit_id: selectedUnitId }, '-changed_at', 100) : [],
    enabled: !!selectedUnitId,
  });

  const { data: monitoresPcc = [] } = useQuery({
    queryKey: ['reportMonitores', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.MonitoramentosPCC.filter({ unit_id: selectedUnitId }, '-monitored_at', 200) : [],
    enabled: !!selectedUnitId,
  });

  const isInRange = (dateStr) => {
    const d = moment(dateStr).format('YYYY-MM-DD');
    return d >= dateFrom && d <= dateTo;
  };

  const filteredTemps = tempRecords.filter(r => {
    const inRange = isInRange(r.recorded_at);
    const byEquip = !filterEquip || r.equipment_id?.toLowerCase().includes(filterEquip.toLowerCase());
    const byResp = !filterResponsible || r.responsible?.toLowerCase().includes(filterResponsible.toLowerCase());
    return inRange && byEquip && byResp;
  });

  const filteredNCs = nonConformities.filter(nc => {
    const inRange = isInRange(nc.created_date);
    const byStatus = filterStatus === 'all' || nc.status === filterStatus;
    const byResp = !filterResponsible || nc.responsible?.toLowerCase().includes(filterResponsible.toLowerCase());
    return inRange && byStatus && byResp;
  });

  const filteredCleaning = cleaningRecords.filter(r => {
    const inRange = isInRange(r.executed_at);
    const byResp = !filterResponsible || r.responsible?.toLowerCase().includes(filterResponsible.toLowerCase());
    return inRange && byResp;
  });

  const filteredOil = oilChanges.filter(r => isInRange(r.changed_at));
  const filteredMonitor = monitoresPcc.filter(r => isInRange(r.monitored_at));

  // Temp conformity chart data — by day
  const tempByDay = {};
  filteredTemps.forEach(r => {
    const day = moment(r.recorded_at).format('DD/MM');
    if (!tempByDay[day]) tempByDay[day] = { day, conforme: 0, nao_conforme: 0 };
    if (r.is_conforming) tempByDay[day].conforme++;
    else tempByDay[day].nao_conforme++;
  });
  const tempChartData = Object.values(tempByDay).slice(-14);

  // NC by source
  const ncBySource = {};
  filteredNCs.forEach(nc => {
    ncBySource[nc.source] = (ncBySource[nc.source] || 0) + 1;
  });
  const ncSourceData = Object.entries(ncBySource).map(([name, value]) => ({ name, value }));

  // NC by severity
  const ncBySeverity = {};
  filteredNCs.forEach(nc => {
    ncBySeverity[nc.severity] = (ncBySeverity[nc.severity] || 0) + 1;
  });
  const ncSeverityData = Object.entries(ncBySeverity).map(([name, value]) => ({ name, value }));

  const totalTemps = filteredTemps.length;
  const tempConforming = filteredTemps.filter(r => r.is_conforming).length;
  const conformRate = totalTemps > 0 ? Math.round((tempConforming / totalTemps) * 100) : 0;
  const pccDesvios = filteredMonitor.filter(m => !m.is_conforming).length;

  const sourceLabel = { temperatura: 'Temp.', limpeza: 'Limpeza', oleo: 'Óleo', hortifruti: 'Hortifruti', checklist: 'Checklist', manual: 'Manual' };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise e rastreabilidade por período</p>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Filtros</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-[10px]">De</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Até</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Responsável</Label>
              <Input placeholder="Nome..." value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Status NC</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvida">Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-[10px]">Equipamento (código)</Label>
            <Input placeholder="Ex: G1, C2" value={filterEquip} onChange={e => setFilterEquip(e.target.value)} className="mt-0.5 h-8 text-xs w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{conformRate}%</p>
            <p className="text-[10px] text-muted-foreground">Taxa de Conformidade</p>
            <p className="text-[10px] text-muted-foreground">{tempConforming}/{totalTemps} temp.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold ${filteredNCs.filter(n=>n.status !== 'resolvida').length > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              {filteredNCs.filter(n=>n.status !== 'resolvida').length}
            </p>
            <p className="text-[10px] text-muted-foreground">NCs Abertas</p>
            <p className="text-[10px] text-muted-foreground">{filteredNCs.length} total no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold ${pccDesvios > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{pccDesvios}</p>
            <p className="text-[10px] text-muted-foreground">Desvios PCC</p>
            <p className="text-[10px] text-muted-foreground">{filteredMonitor.length} monit. total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{filteredCleaning.length}</p>
            <p className="text-[10px] text-muted-foreground">Limpezas Registradas</p>
            <p className="text-[10px] text-muted-foreground">{filteredOil.length} trocas de óleo</p>
          </CardContent>
        </Card>
      </div>

      {/* Parecer PDF */}
      <div className="mb-5">
        <ParecerPDF />
      </div>

      <Tabs defaultValue="temperaturas">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="temperaturas">Temperaturas</TabsTrigger>
          <TabsTrigger value="ncs">Não Conformidades</TabsTrigger>
          <TabsTrigger value="haccp">HACCP/PCCs</TabsTrigger>
          <TabsTrigger value="registros">Registros</TabsTrigger>
        </TabsList>

        {/* Temperaturas */}
        <TabsContent value="temperaturas">
          {tempChartData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Conformidade Diária</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tempChartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="conforme" name="Conforme" fill="#16a34a" stackId="a" />
                    <Bar dataKey="nao_conforme" name="Não Conforme" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {filteredTemps.slice(0, 50).map(r => (
              <Card key={r.id} className={`${!r.is_conforming ? 'border-red-200' : ''}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">{r.equipment_id}</span>
                      <span className={`text-lg font-bold ${!r.is_conforming ? 'text-red-600' : 'text-foreground'}`}>{r.temperature}°C</span>
                      <Badge className={`text-[10px] ${r.is_conforming ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {r.is_conforming ? 'Conforme' : 'NC'}
                      </Badge>
                    </div>
                    {r.corrective_action && <p className="text-xs text-red-600 mt-0.5">{r.corrective_action}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.responsible}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">{moment(r.recorded_at).format('DD/MM HH:mm')}</p>
                </CardContent>
              </Card>
            ))}
            {filteredTemps.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro no período</p>}
          </div>
        </TabsContent>

        {/* NCs */}
        <TabsContent value="ncs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {ncSourceData.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">NCs por Origem</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={ncSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${sourceLabel[name] || name}: ${value}`} labelLine={false}>
                        {ncSourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {ncSeverityData.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">NCs por Gravidade</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={ncSeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {ncSeverityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-2">
            {filteredNCs.map(nc => (
              <Card key={nc.id} className={nc.status !== 'resolvida' && nc.severity === 'critica' ? 'border-red-300' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{nc.title}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge className={`text-[10px] ${nc.severity === 'critica' ? 'bg-red-100 text-red-700' : nc.severity === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{nc.severity}</Badge>
                        <Badge variant="outline" className="text-[10px]">{sourceLabel[nc.source] || nc.source}</Badge>
                        <Badge className={`text-[10px] ${nc.status === 'resolvida' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{nc.status}</Badge>
                      </div>
                      {nc.corrective_action && <p className="text-xs text-emerald-700 mt-1">{nc.corrective_action}</p>}
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">{moment(nc.created_date).format('DD/MM/YY')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNCs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma NC no período</p>}
          </div>
        </TabsContent>

        {/* HACCP PCCs */}
        <TabsContent value="haccp">
          {filteredMonitor.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum monitoramento de PCC no período</p>
          ) : (
            <div className="space-y-2">
              {filteredMonitor.map(m => (
                <Card key={m.id} className={!m.is_conforming ? 'border-red-300' : ''}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {m.is_conforming
                          ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Conforme</Badge>
                          : <Badge className="bg-red-100 text-red-700 text-[10px]">DESVIO</Badge>}
                        <span className="text-sm font-bold">{m.value} {m.unit_measure}</span>
                      </div>
                      {m.corrective_action && <p className="text-xs text-red-600 mt-0.5">{m.corrective_action}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.responsible}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{moment(m.monitored_at).format('DD/MM HH:mm')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outros registros */}
        <TabsContent value="registros">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Limpezas ({filteredCleaning.length})</p>
              {filteredCleaning.slice(0, 20).map(r => (
                <Card key={r.id} className="mb-2">
                  <CardContent className="p-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.product_used}</p>
                      <p className="text-[10px] text-muted-foreground">{r.responsible}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{moment(r.executed_at).format('DD/MM HH:mm')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Trocas de Óleo ({filteredOil.length})</p>
              {filteredOil.slice(0, 20).map(r => (
                <Card key={r.id} className="mb-2">
                  <CardContent className="p-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.reason}</p>
                      <p className="text-[10px] text-muted-foreground">{r.responsible}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{moment(r.changed_at).format('DD/MM HH:mm')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}