import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import PlanForm from '@meucuiabar/components/haccp/PlanForm';
import PCCForm from '@meucuiabar/components/haccp/PCCForm';
import EtapaForm from '@meucuiabar/components/haccp/EtapaForm';
import PerigosForm from '@meucuiabar/components/haccp/PerigosForm';
import MonitorForm from '@meucuiabar/components/haccp/MonitorForm';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Badge } from '@meucuiabar/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@meucuiabar/components/ui/tabs';
import { Skeleton } from '@meucuiabar/components/ui/skeleton';
import {
  ShieldCheck, Plus, ChevronRight, AlertTriangle, CheckCircle2, ClipboardList,
  Beaker, Pencil, Activity, ListTree
} from 'lucide-react';
import moment from 'moment';

const statusColors = {
  rascunho: 'bg-gray-100 text-gray-700',
  ativo: 'bg-emerald-100 text-emerald-700',
  em_revisao: 'bg-amber-100 text-amber-800',
  obsoleto: 'bg-red-100 text-red-700',
};

const hazardColors = {
  biologico: 'bg-blue-100 text-blue-700',
  quimico: 'bg-purple-100 text-purple-700',
  fisico: 'bg-orange-100 text-orange-700',
};

const hazardIcons = { biologico: '🦠', quimico: '⚗️', fisico: '🔩' };

export default function HACCPDigital() {
  const { selectedUnitId, isSupervisor } = useUnit();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [showPccForm, setShowPccForm] = useState(false);
  const [editPcc, setEditPcc] = useState(null);
  const [showEtapaForm, setShowEtapaForm] = useState(false);
  const [showPerigosForm, setShowPerigosForm] = useState(false);
  const [selectedEtapaId, setSelectedEtapaId] = useState(null);
  const [showMonitorForm, setShowMonitorForm] = useState(false);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['planosHACCP', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.PlanosHACCP.filter({ unit_id: selectedUnitId }) : [],
    enabled: !!selectedUnitId,
  });

  const { data: etapas = [] } = useQuery({
    queryKey: ['etapas', selectedPlan?.id],
    queryFn: () => base44.entities.EtapasProcesso.filter({ plano_id: selectedPlan.id }),
    enabled: !!selectedPlan?.id,
  });

  const { data: perigos = [] } = useQuery({
    queryKey: ['perigos', selectedPlan?.id],
    queryFn: () => base44.entities.PerigosProcesso.filter({ plano_id: selectedPlan.id }),
    enabled: !!selectedPlan?.id,
  });

  const { data: pccs = [] } = useQuery({
    queryKey: ['pccs', selectedPlan?.id],
    queryFn: () => base44.entities.PCCs.filter({ plano_id: selectedPlan.id, active: true }),
    enabled: !!selectedPlan?.id,
  });

  const { data: monitores = [] } = useQuery({
    queryKey: ['monitoresPcc', selectedPlan?.id],
    queryFn: () => base44.entities.MonitoramentosPCC.filter({ plano_id: selectedPlan.id }, '-monitored_at', 30),
    enabled: !!selectedPlan?.id,
  });

  const allPccs = useQuery({
    queryKey: ['allPccs', selectedUnitId],
    queryFn: () => base44.entities.PCCs.filter({ unit_id: selectedUnitId, active: true }),
    enabled: !!selectedUnitId,
  }).data || [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['planosHACCP'] });
    queryClient.invalidateQueries({ queryKey: ['etapas'] });
    queryClient.invalidateQueries({ queryKey: ['perigos'] });
    queryClient.invalidateQueries({ queryKey: ['pccs'] });
    queryClient.invalidateQueries({ queryKey: ['monitoresPcc'] });
    queryClient.invalidateQueries({ queryKey: ['allPccs'] });
    queryClient.invalidateQueries({ queryKey: ['nonConformities'] });
  };

  if (!selectedPlan) {
    return (
      <div>
        <PageHeader
          title="HACCP Digital"
          subtitle="Análise de Perigos e Pontos Críticos de Controle"
          onAdd={isSupervisor ? () => { setEditPlan(null); setShowPlanForm(true); } : undefined}
          addLabel="Novo Plano"
        />

        {showPlanForm && (
          <PlanForm
            open={showPlanForm}
            onClose={() => setShowPlanForm(false)}
            onSaved={refresh}
            editPlan={editPlan}
          />
        )}

        {/* Quick Monitor */}
        {allPccs.length > 0 && (
          <div className="mb-4">
            <Button onClick={() => setShowMonitorForm(true)} className="w-full bg-amber-600 hover:bg-amber-700">
              <Activity className="w-4 h-4 mr-2" />Registrar Monitoramento de PCC
            </Button>
            {showMonitorForm && (
              <div className="mt-3">
                <MonitorForm
                  pccs={allPccs}
                  onSave={() => { setShowMonitorForm(false); refresh(); }}
                  onCancel={() => setShowMonitorForm(false)}
                />
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : planos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <ShieldCheck className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Nenhum Plano HACCP</p>
                <p className="text-xs text-muted-foreground mt-1">Crie o primeiro plano para iniciar a análise de perigos</p>
              </div>
              {isSupervisor && (
                <Button size="sm" onClick={() => { setEditPlan(null); setShowPlanForm(true); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Criar Plano HACCP
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {planos.map(p => (
              <Card key={p.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedPlan(p)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-semibold">{p.name}</p>
                        <Badge className={`text-[10px] ${statusColors[p.status]}`}>{p.status?.replace('_', ' ')}</Badge>
                      </div>
                      {p.product_line && <p className="text-xs text-muted-foreground mt-1 ml-6">{p.product_line}</p>}
                      <p className="text-[10px] text-muted-foreground ml-6 mt-0.5">Resp.: {p.responsible} · v{p.version}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Plan detail view
  const sortedEtapas = [...etapas].sort((a, b) => a.step_number - b.step_number);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedPlan(null)}>
          ← Planos
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold">{selectedPlan.name}</span>
        <Badge className={`text-[10px] ml-1 ${statusColors[selectedPlan.status]}`}>{selectedPlan.status}</Badge>
        {isSupervisor && (
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => { setEditPlan(selectedPlan); setShowPlanForm(true); }}>
            <Pencil className="w-3 h-3" />
          </Button>
        )}
      </div>

      {showPlanForm && (
        <PlanForm
          open={showPlanForm}
          onClose={() => setShowPlanForm(false)}
          onSaved={() => { refresh(); setSelectedPlan(null); }}
          editPlan={editPlan}
        />
      )}
      {showEtapaForm && (
        <EtapaForm
          open={showEtapaForm}
          onClose={() => setShowEtapaForm(false)}
          onSaved={refresh}
          planoId={selectedPlan.id}
          nextStep={sortedEtapas.length + 1}
        />
      )}
      {showPerigosForm && (
        <PerigosForm
          open={showPerigosForm}
          onClose={() => setShowPerigosForm(false)}
          onSaved={refresh}
          planoId={selectedPlan.id}
          etapaId={selectedEtapaId}
        />
      )}
      {showPccForm && (
        <PCCForm
          open={showPccForm}
          onClose={() => setShowPccForm(false)}
          onSaved={refresh}
          editPcc={editPcc}
          planoId={selectedPlan.id}
          etapas={sortedEtapas}
        />
      )}

      <Tabs defaultValue="fluxo">
        <TabsList className="mb-4">
          <TabsTrigger value="fluxo">Fluxo do Processo</TabsTrigger>
          <TabsTrigger value="pccs">PCCs ({pccs.length})</TabsTrigger>
          <TabsTrigger value="monitores">Monitoramentos ({monitores.length})</TabsTrigger>
        </TabsList>

        {/* Fluxo do Processo */}
        <TabsContent value="fluxo">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{sortedEtapas.length} etapas cadastradas</p>
            {isSupervisor && (
              <Button size="sm" variant="outline" onClick={() => setShowEtapaForm(true)}>
                <Plus className="w-3 h-3 mr-1" />Etapa
              </Button>
            )}
          </div>
          {sortedEtapas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <ListTree className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedEtapas.map((etapa, idx) => {
                const etapaPerigos = perigos.filter(p => p.etapa_id === etapa.id);
                return (
                  <Card key={etapa.id} className="overflow-hidden">
                    <div className={`h-1 ${etapa.is_pcc ? 'bg-red-500' : etapa.is_ppr ? 'bg-amber-400' : 'bg-muted'}`} />
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted rounded px-1.5 py-0.5">{etapa.step_number}</span>
                            <p className="text-sm font-semibold">{etapa.name}</p>
                            {etapa.is_pcc && <Badge className="bg-red-100 text-red-700 text-[10px]">PCC</Badge>}
                            {etapa.is_ppr && <Badge className="bg-amber-100 text-amber-700 text-[10px]">PPR</Badge>}
                          </div>
                          {etapa.description && <p className="text-xs text-muted-foreground mt-1 ml-7">{etapa.description}</p>}
                          {etapaPerigos.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-7">
                              {etapaPerigos.map(p => (
                                <Badge key={p.id} className={`text-[10px] ${hazardColors[p.type]}`}>
                                  {hazardIcons[p.type]} {p.description}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {isSupervisor && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setSelectedEtapaId(etapa.id); setShowPerigosForm(true); }}>
                            <Plus className="w-3 h-3 mr-1" />Perigo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PCCs */}
        <TabsContent value="pccs">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">{pccs.length} PCCs cadastrados</p>
            {isSupervisor && (
              <Button size="sm" variant="outline" onClick={() => { setEditPcc(null); setShowPccForm(true); }}>
                <Plus className="w-3 h-3 mr-1" />Novo PCC
              </Button>
            )}
          </div>
          {pccs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum PCC cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {pccs.map(pcc => (
                <Card key={pcc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-red-100 text-red-700 text-xs font-mono">{pcc.number}</Badge>
                          <p className="text-sm font-semibold">{pcc.name}</p>
                          <Badge className={`text-[10px] ${hazardColors[pcc.hazard_type]}`}>{hazardIcons[pcc.hazard_type]} {pcc.hazard_type}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Limite: {pcc.critical_limit_min ?? '–'} a {pcc.critical_limit_max ?? '–'} {pcc.limit_unit}</span>
                          <span>Freq.: {pcc.monitoring_frequency || '–'}</span>
                          <span>Método: {pcc.monitoring_method || '–'}</span>
                          <span>Resp.: {pcc.responsible_monitoring || '–'}</span>
                        </div>
                        {pcc.corrective_action && (
                          <p className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1 mt-2">
                            Ação padrão: {pcc.corrective_action}
                          </p>
                        )}
                      </div>
                      {isSupervisor && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditPcc(pcc); setShowPccForm(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Monitoramentos */}
        <TabsContent value="monitores">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setShowMonitorForm(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-3 h-3 mr-1" />Monitorar PCC
            </Button>
          </div>
          {showMonitorForm && (
            <div className="mb-4">
              <MonitorForm
                pccs={pccs}
                onSave={() => { setShowMonitorForm(false); refresh(); }}
                onCancel={() => setShowMonitorForm(false)}
              />
            </div>
          )}
          {monitores.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum monitoramento registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {monitores.map(m => {
                const pcc = pccs.find(p => p.id === m.pcc_id);
                return (
                  <Card key={m.id} className={`overflow-hidden ${!m.is_conforming ? 'border-red-300' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {m.is_conforming
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                            <span className="text-sm font-semibold">{m.value} {m.unit_measure || pcc?.limit_unit}</span>
                            <span className="text-xs text-muted-foreground">{pcc?.number} — {pcc?.name}</span>
                          </div>
                          {m.corrective_action && <p className="text-xs text-red-600 mt-1 ml-6 bg-red-50 rounded px-2 py-1">{m.corrective_action}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1 ml-6">{m.responsible}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground shrink-0">{moment(m.monitored_at).format('DD/MM HH:mm')}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}