import React from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';
import AlertsList from '@meucuiabar/components/dashboard/AlertsList';
import RecentActivity from '@meucuiabar/components/dashboard/RecentActivity';
import { Thermometer, AlertTriangle, ClipboardCheck, ShieldCheck, TrendingUp, CheckCircle2, XCircle, Activity } from 'lucide-react';
import moment from 'moment';
import { createPageUrl } from '@meucuiabar/utils';
import { Link } from 'react-router-dom';

function StatCard({ label, value, sub, icon: IconComp, color, to }) {
  const Icon = IconComp;
  const colorMap = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-700',
    primary: 'bg-primary/10 text-primary',
  };

  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color === 'red' ? 'text-destructive' : color === 'green' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          {Icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { selectedUnitId } = useUnit();
  const today = moment().format('YYYY-MM-DD');

  const { data: tempRecords = [], isLoading: loadingTemp } = useQuery({
    queryKey: ['tempRecords', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.TemperatureRecord.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ['nonConformities', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.NonConformity.filter({ unit_id: selectedUnitId }, '-created_date', 100) : [],
    enabled: !!selectedUnitId,
  });

  const { data: cleaningRecords = [] } = useQuery({
    queryKey: ['cleaningRecords', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningRecord.filter({ unit_id: selectedUnitId }, '-created_date', 50) : [],
    enabled: !!selectedUnitId,
  });

  const { data: oilChanges = [] } = useQuery({
    queryKey: ['oilChanges', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.OilChange.filter({ unit_id: selectedUnitId }, '-created_date', 20) : [],
    enabled: !!selectedUnitId,
  });

  const { data: produceWashings = [] } = useQuery({
    queryKey: ['produceWashings', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.ProduceWashing.filter({ unit_id: selectedUnitId }, '-created_date', 20) : [],
    enabled: !!selectedUnitId,
  });

  const { data: checklistResponses = [] } = useQuery({
    queryKey: ['checklistResponses', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.ChecklistResponse.filter({ unit_id: selectedUnitId }, '-created_date', 20) : [],
    enabled: !!selectedUnitId,
  });

  const { data: monitoramentos = [] } = useQuery({
    queryKey: ['allMonitoramentos', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.MonitoramentosPCC.filter({ unit_id: selectedUnitId }, '-monitored_at', 50) : [],
    enabled: !!selectedUnitId,
  });

  const todayTemps = tempRecords.filter(r => r.recorded_at?.startsWith(today));
  const outOfRange = todayTemps.filter(r => !r.is_conforming);
  const openNCs = nonConformities.filter(nc => nc.status !== 'resolvida');
  const criticalNCs = openNCs.filter(nc => nc.severity === 'critica');
  const todayChecklists = checklistResponses.filter(r => r.date === today).length;
  const pccDesviosHoje = monitoramentos.filter(m => !m.is_conforming && m.monitored_at?.startsWith(today));

  const totalTodayTemps = todayTemps.length;
  const todayConforming = todayTemps.filter(r => r.is_conforming).length;
  const conformRate = totalTodayTemps > 0 ? Math.round((todayConforming / totalTodayTemps) * 100) : 100;

  // Reincidências: equipamentos com mais de 1 NC não resolvida no mesmo equipamento
  const ncByEquip = {};
  nonConformities.filter(nc => nc.status !== 'resolvida' && nc.source === 'temperatura').forEach(nc => {
    const m = nc.description?.match(/Equipamento ([GCR][0-9])/);
    if (m) ncByEquip[m[1]] = (ncByEquip[m[1]] || 0) + 1;
  });
  const reincidencias = Object.entries(ncByEquip).filter(([_, count]) => count > 1);

  if (!selectedUnitId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Selecione uma unidade para começar</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard HACCP</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumo operacional — {moment().format('DD/MM/YYYY')}</p>
      </div>

      {loadingTemp ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Critical alerts strip */}
          {(criticalNCs.length > 0 || pccDesviosHoje.length > 0) && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">⚠ Atenção Imediata Necessária</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {criticalNCs.length > 0 && <Badge className="bg-red-200 text-red-800 text-[10px]">{criticalNCs.length} NC crítica{criticalNCs.length > 1 ? 's' : ''}</Badge>}
                  {pccDesviosHoje.length > 0 && <Badge className="bg-red-200 text-red-800 text-[10px]">{pccDesviosHoje.length} desvio{pccDesviosHoje.length > 1 ? 's' : ''} de PCC hoje</Badge>}
                  {reincidencias.length > 0 && <Badge className="bg-orange-200 text-orange-800 text-[10px]">{reincidencias.length} equipamento{reincidencias.length > 1 ? 's' : ''} com reincidência</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard
              label="Conformidade Hoje"
              value={`${conformRate}%`}
              sub={`${todayConforming}/${totalTodayTemps} temperaturas`}
              icon={conformRate >= 90 ? CheckCircle2 : XCircle}
              color={conformRate >= 90 ? 'green' : conformRate >= 70 ? 'amber' : 'red'}
              to={createPageUrl('Temperatures')}
            />
            <StatCard
              label="NCs Abertas"
              value={openNCs.length}
              sub={`${criticalNCs.length} críticas`}
              icon={AlertTriangle}
              color={openNCs.length === 0 ? 'green' : criticalNCs.length > 0 ? 'red' : 'amber'}
              to={createPageUrl('NonConformities')}
            />
            <StatCard
              label="PCCs em Desvio"
              value={pccDesviosHoje.length}
              sub={`Hoje`}
              icon={Activity}
              color={pccDesviosHoje.length === 0 ? 'green' : 'red'}
              to={createPageUrl('HACCPDigital')}
            />
            <StatCard
              label="Checklists Hoje"
              value={todayChecklists}
              sub=""
              icon={ClipboardCheck}
              color="blue"
              to={createPageUrl('Checklists')}
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">Temp. Fora da Faixa</p>
                <p className={`text-xl font-bold ${outOfRange.length > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{outOfRange.length}</p>
                <p className="text-[10px] text-muted-foreground">Hoje</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">Limpezas Hoje</p>
                <p className="text-xl font-bold text-foreground">{cleaningRecords.filter(r => r.executed_at?.startsWith(today)).length}</p>
                <p className="text-[10px] text-muted-foreground">registradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">Reincidências</p>
                <p className={`text-xl font-bold ${reincidencias.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{reincidencias.length}</p>
                <p className="text-[10px] text-muted-foreground">equipamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">Hortifruti Hoje</p>
                <p className="text-xl font-bold text-foreground">{produceWashings.filter(r => r.start_time?.startsWith(today)).length}</p>
                <p className="text-[10px] text-muted-foreground">lavagens</p>
              </CardContent>
            </Card>
          </div>

          {/* Reincidências highlight */}
          {reincidencias.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Equipamentos com Reincidência</p>
                <div className="flex flex-wrap gap-2">
                  {reincidencias.map(([equip, count]) => (
                    <Badge key={equip} className="bg-amber-200 text-amber-800 text-xs">
                      {equip}: {count} NCs abertas
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AlertsList nonConformities={nonConformities} />
            <RecentActivity
              tempRecords={tempRecords}
              cleaningRecords={cleaningRecords}
              oilChanges={oilChanges}
              produceWashings={produceWashings}
            />
          </div>
        </>
      )}
    </div>
  );
}