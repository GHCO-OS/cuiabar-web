import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Button } from '@meucuiabar/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@meucuiabar/components/ui/card';
import { Input } from '@meucuiabar/components/ui/input';
import { Label } from '@meucuiabar/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { FileText, Download, Loader2, ShieldCheck } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';

const PERIOD_OPTIONS = [
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 60 dias', days: 60 },
  { label: 'Últimos 90 dias', days: 90 },
];

export default function ParecerPDF() {
  const { selectedUnitId, units, currentUser } = useUnit();
  const [period, setPeriod] = useState('30');
  const [generating, setGenerating] = useState(false);

  const days = parseInt(period);
  const dateFrom = moment().subtract(days, 'days').format('YYYY-MM-DD');
  const dateTo = moment().format('YYYY-MM-DD');
  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const isInRange = (dateStr) => {
    const d = moment(dateStr).format('YYYY-MM-DD');
    return d >= dateFrom && d <= dateTo;
  };

  const { data: tempRecords = [] } = useQuery({
    queryKey: ['pdfTemps', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.TemperatureRecord.filter({ unit_id: selectedUnitId }, '-recorded_at', 1000) : [],
    enabled: !!selectedUnitId,
  });

  const { data: nonConformities = [] } = useQuery({
    queryKey: ['pdfNCs', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.NonConformity.filter({ unit_id: selectedUnitId }, '-created_date', 500) : [],
    enabled: !!selectedUnitId,
  });

  const { data: cleaningRecords = [] } = useQuery({
    queryKey: ['pdfCleaning', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.CleaningRecord.filter({ unit_id: selectedUnitId }, '-executed_at', 500) : [],
    enabled: !!selectedUnitId,
  });

  const { data: oilChanges = [] } = useQuery({
    queryKey: ['pdfOil', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.OilChange.filter({ unit_id: selectedUnitId }, '-changed_at', 200) : [],
    enabled: !!selectedUnitId,
  });

  const { data: monitoresPcc = [] } = useQuery({
    queryKey: ['pdfMonitores', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.MonitoramentosPCC.filter({ unit_id: selectedUnitId }, '-monitored_at', 500) : [],
    enabled: !!selectedUnitId,
  });

  const { data: checklistResponses = [] } = useQuery({
    queryKey: ['pdfChecklists', selectedUnitId],
    queryFn: () => selectedUnitId ? base44.entities.ChecklistResponse.filter({ unit_id: selectedUnitId }, '-created_date', 200) : [],
    enabled: !!selectedUnitId,
  });

  const filteredTemps = tempRecords.filter(r => isInRange(r.recorded_at));
  const filteredNCs = nonConformities.filter(nc => isInRange(nc.created_date));
  const filteredCleaning = cleaningRecords.filter(r => isInRange(r.executed_at));
  const filteredOil = oilChanges.filter(r => isInRange(r.changed_at));
  const filteredMonitor = monitoresPcc.filter(m => isInRange(m.monitored_at));
  const filteredChecklists = checklistResponses.filter(r => isInRange(r.date));

  const totalTemps = filteredTemps.length;
  const tempConforming = filteredTemps.filter(r => r.is_conforming).length;
  const conformRate = totalTemps > 0 ? Math.round((tempConforming / totalTemps) * 100) : 100;
  const openNCs = filteredNCs.filter(nc => nc.status !== 'resolvida');
  const criticalNCs = filteredNCs.filter(nc => nc.severity === 'critica');
  const pccDesvios = filteredMonitor.filter(m => !m.is_conforming);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const usableW = pageW - 30; // margin 15 each side
      const margin = 15;
      let y = margin;

      const addPage = () => { doc.addPage(); y = margin; };
      const checkY = (needed = 15) => { if (y + needed > 272) addPage(); };

      // ── Helper: draw a simple table ──────────────────────────────
      const drawTable = ({ headers, rows, colWidths, headerColor = [22, 101, 52], rowH = 7, fontSize = 8 }) => {
        const tableW = colWidths.reduce((a, b) => a + b, 0);
        checkY(rowH * 2 + 4);

        // Header row
        doc.setFillColor(...headerColor);
        doc.rect(margin, y, tableW, rowH, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        let cx = margin;
        headers.forEach((h, i) => {
          doc.text(String(h), cx + 1.5, y + rowH - 2);
          cx += colWidths[i];
        });
        y += rowH;

        // Data rows
        doc.setFont('helvetica', 'normal');
        rows.forEach((row, ri) => {
          checkY(rowH + 2);
          // alternating bg
          if (ri % 2 === 0) {
            doc.setFillColor(245, 250, 246);
            doc.rect(margin, y, tableW, rowH, 'F');
          }
          doc.setDrawColor(220, 220, 220);
          doc.rect(margin, y, tableW, rowH, 'S');
          let cx2 = margin;
          row.forEach((cell, ci) => {
            const txt = String(cell ?? '–');
            doc.setTextColor(0, 0, 0);
            // colour status column heuristic
            if (txt === 'CONFORME' || txt.startsWith('✓')) doc.setTextColor(22, 101, 52);
            else if (txt === 'DESVIO' || txt === 'CRITICA' || txt.startsWith('✗')) doc.setTextColor(185, 28, 28);
            else if (txt === 'ALTA' || txt.startsWith('⚠')) doc.setTextColor(180, 100, 0);
            const clipped = txt.length > 40 ? txt.slice(0, 39) + '…' : txt;
            doc.text(clipped, cx2 + 1.5, y + rowH - 2);
            cx2 += colWidths[ci];
          });
          y += rowH;
        });
        doc.setTextColor(0, 0, 0);
        y += 5;
      };

      // ── HEADER ──────────────────────────────────────────────────
      doc.setFillColor(22, 101, 52);
      doc.rect(0, 0, pageW, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('PARECER TECNICO - SISTEMA HACCP', margin, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Vigilancia Sanitaria - Seguranca Alimentar', margin, 20);
      doc.text(`Emitido em: ${moment().format('DD/MM/YYYY HH:mm')}`, margin, 26);
      doc.text(`Por: ${currentUser?.full_name || currentUser?.email || '-'}`, pageW - margin - 65, 26);
      y = 40;

      // ── 1. IDENTIFICAÇÃO ─────────────────────────────────────────
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('1. IDENTIFICACAO DA UNIDADE', margin, y); y += 6;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Unidade: ${selectedUnit?.name || '-'}`, margin, y); y += 5;
      if (selectedUnit?.address) { doc.text(`Endereco: ${selectedUnit.address}`, margin, y); y += 5; }
      doc.text(`Periodo: ${moment(dateFrom).format('DD/MM/YYYY')} a ${moment(dateTo).format('DD/MM/YYYY')} (${days} dias)`, margin, y);
      y += 10;

      // ── 2. RESUMO EXECUTIVO ──────────────────────────────────────
      checkY(20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('2. RESUMO EXECUTIVO DE CONFORMIDADE', margin, y); y += 6;

      drawTable({
        headers: ['Indicador', 'Resultado', 'Status'],
        colWidths: [95, 50, 35],
        rowH: 8,
        fontSize: 8,
        rows: [
          ['Taxa de Conformidade de Temperatura', `${conformRate}% (${tempConforming}/${totalTemps})`, conformRate >= 95 ? '✓ EXCELENTE' : conformRate >= 80 ? '⚠ ACEITAVEL' : '✗ ATENCAO'],
          ['Nao Conformidades no Periodo', `${filteredNCs.length} total / ${openNCs.length} abertas`, openNCs.length === 0 ? '✓ RESOLVIDAS' : `⚠ ${openNCs.length} PENDENTES`],
          ['NCs Criticas', `${criticalNCs.length}`, criticalNCs.length === 0 ? '✓ NENHUMA' : `✗ ${criticalNCs.length} CRITICA(S)`],
          ['Desvios de PCCs', `${pccDesvios.length}/${filteredMonitor.length} monitoramentos`, pccDesvios.length === 0 ? '✓ SEM DESVIOS' : `✗ ${pccDesvios.length} DESVIO(S)`],
          ['Registros de Limpeza', `${filteredCleaning.length}`, filteredCleaning.length > 0 ? '✓ DOCUMENTADO' : '⚠ SEM REGISTROS'],
          ['Trocas de Oleo', `${filteredOil.length}`, filteredOil.length > 0 ? '✓ DOCUMENTADO' : '-'],
          ['Checklists Preenchidos', `${filteredChecklists.length}`, filteredChecklists.length > 0 ? '✓ DOCUMENTADO' : '-'],
        ],
      });

      // ── 3. TEMPERATURAS ──────────────────────────────────────────
      checkY(20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('3. CONTROLE DE TEMPERATURAS', margin, y); y += 6;

      const tempByDay = {};
      filteredTemps.forEach(r => {
        const day = moment(r.recorded_at).format('DD/MM/YY');
        if (!tempByDay[day]) tempByDay[day] = { conforme: 0, nc: 0 };
        if (r.is_conforming) tempByDay[day].conforme++;
        else tempByDay[day].nc++;
      });

      if (Object.keys(tempByDay).length > 0) {
        drawTable({
          headers: ['Data', 'Conformes', 'Nao Conformes', 'Total', 'Taxa'],
          colWidths: [30, 32, 38, 28, 52],
          rows: Object.entries(tempByDay).slice(-30).map(([day, d]) => {
            const total = d.conforme + d.nc;
            const rate = Math.round((d.conforme / total) * 100);
            return [day, d.conforme, d.nc, total, `${rate}%`];
          }),
        });
      }

      const outOfRange = filteredTemps.filter(r => !r.is_conforming);
      if (outOfRange.length > 0) {
        checkY(20);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text(`Registros Fora da Faixa (${outOfRange.length})`, margin, y);
        doc.setTextColor(0, 0, 0); y += 5;
        drawTable({
          headers: ['Data/Hora', 'Temp (C)', 'Acao Corretiva', 'Responsavel'],
          colWidths: [35, 25, 70, 50],
          headerColor: [185, 28, 28],
          rows: outOfRange.slice(0, 25).map(r => [
            moment(r.recorded_at).format('DD/MM/YY HH:mm'),
            r.temperature,
            r.corrective_action || '-',
            r.responsible,
          ]),
        });
      }

      // ── 4. NÃO CONFORMIDADES ─────────────────────────────────────
      checkY(20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('4. NAO CONFORMIDADES', margin, y); y += 6;

      if (filteredNCs.length > 0) {
        drawTable({
          headers: ['Data', 'Titulo', 'Gravidade', 'Status'],
          colWidths: [25, 85, 30, 40],
          rows: filteredNCs.map(nc => [
            moment(nc.created_date).format('DD/MM/YY'),
            (nc.title || '').slice(0, 50),
            nc.severity?.toUpperCase() || '-',
            nc.status || '-',
          ]),
        });
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.setTextColor(22, 101, 52);
        doc.text('✓ Nenhuma nao conformidade registrada no periodo.', margin, y);
        doc.setTextColor(0, 0, 0); y += 10;
      }

      // ── 5. MONITORAMENTOS PCC ────────────────────────────────────
      checkY(20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('5. MONITORAMENTOS HACCP / PCCs', margin, y); y += 6;

      if (filteredMonitor.length > 0) {
        drawTable({
          headers: ['Data/Hora', 'Valor', 'Unid.', 'Resultado', 'Responsavel'],
          colWidths: [35, 20, 18, 32, 75],
          rows: filteredMonitor.slice(0, 40).map(m => [
            moment(m.monitored_at).format('DD/MM/YY HH:mm'),
            m.value,
            m.unit_measure || '-',
            m.is_conforming ? 'CONFORME' : 'DESVIO',
            m.responsible,
          ]),
        });
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.text('Nenhum monitoramento de PCC registrado no periodo.', margin, y); y += 10;
      }

      // ── 6. LIMPEZA ───────────────────────────────────────────────
      checkY(20);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('6. REGISTROS DE LIMPEZA', margin, y); y += 6;

      if (filteredCleaning.length > 0) {
        drawTable({
          headers: ['Data/Hora', 'Produto', 'Diluicao', 'Responsavel'],
          colWidths: [35, 55, 35, 55],
          rows: filteredCleaning.slice(0, 30).map(r => [
            moment(r.executed_at).format('DD/MM/YY HH:mm'),
            r.product_used || '-',
            r.dilution || '-',
            r.responsible || '-',
          ]),
        });
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.text('Nenhum registro de limpeza no periodo.', margin, y); y += 10;
      }

      // ── 7. TROCA DE ÓLEO ─────────────────────────────────────────
      if (filteredOil.length > 0) {
        checkY(20);
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('7. TROCAS DE OLEO', margin, y); y += 6;
        drawTable({
          headers: ['Data/Hora', 'Motivo', 'Condicao Visual', 'Vol (L)', 'Responsavel'],
          colWidths: [35, 35, 35, 20, 55],
          rows: filteredOil.map(r => [
            moment(r.changed_at).format('DD/MM/YY HH:mm'),
            r.reason || '-',
            r.visual_condition || '-',
            r.volume_liters || '-',
            r.responsible || '-',
          ]),
        });
      }

      // ── 8. DECLARAÇÃO ────────────────────────────────────────────
      checkY(45);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('8. DECLARACAO DE CONFORMIDADE', margin, y); y += 7;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      const declaracao = `Declaro que o estabelecimento ${selectedUnit?.name || ''}, localizado em ${selectedUnit?.address || '-'}, opera com sistema HACCP implantado e documentado conforme RDC ANVISA n 275/2002 e RDC n 216/2004. Os registros acima foram gerados automaticamente pelo sistema de gestao de seguranca alimentar e representam fielmente as operacoes realizadas no periodo de ${moment(dateFrom).format('DD/MM/YYYY')} a ${moment(dateTo).format('DD/MM/YYYY')}.`;
      const lines = doc.splitTextToSize(declaracao, usableW);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 12;

      checkY(25);
      doc.setDrawColor(0);
      doc.line(margin, y, margin + 70, y);
      doc.line(pageW - margin - 70, y, pageW - margin, y);
      y += 4;
      doc.setFontSize(8);
      doc.text('Responsavel pela Unidade', margin, y);
      doc.text('Data e Carimbo', pageW - margin - 70, y);
      y += 6;
      doc.text(currentUser?.full_name || '____________________', margin, y);
      doc.text(moment().format('DD/MM/YYYY'), pageW - margin - 70, y);

      // ── FOOTER ───────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120);
      doc.text(`MeuCuiabar - Sistema HACCP Digital | Pagina ${i}/${pageCount} | Gerado em ${moment().format('DD/MM/YYYY HH:mm')}`, margin, 290);
      }

      const fileName = `Parecer_VS_${selectedUnit?.name?.replace(/\s/g, '_') || 'unidade'}_${moment().format('YYYYMMDD')}.pdf`;
      doc.save(fileName);
    } finally {
      setGenerating(false);
    }
  };

  const isReady = selectedUnitId && !generating;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Parecer para Vigilância Sanitária</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Pacote de defesa completo em PDF — pronto para fiscalização</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-card rounded-lg p-2.5 border">
            <p className="text-lg font-bold text-primary">{conformRate}%</p>
            <p className="text-muted-foreground">Conformidade</p>
          </div>
          <div className="bg-card rounded-lg p-2.5 border">
            <p className={`text-lg font-bold ${filteredNCs.filter(n=>n.status !== 'resolvida').length > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              {filteredNCs.filter(n=>n.status !== 'resolvida').length}
            </p>
            <p className="text-muted-foreground">NCs Abertas</p>
          </div>
          <div className="bg-card rounded-lg p-2.5 border">
            <p className="text-lg font-bold text-foreground">{filteredCleaning.length}</p>
            <p className="text-muted-foreground">Limpezas</p>
          </div>
          <div className="bg-card rounded-lg p-2.5 border">
            <p className="text-lg font-bold text-foreground">{filteredMonitor.length}</p>
            <p className="text-muted-foreground">Monit. PCC</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <Label className="text-xs">Período do relatório</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="mt-1 w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(o => (
                  <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            <p>{moment(dateFrom).format('DD/MM/YYYY')} → {moment(dateTo).format('DD/MM/YYYY')}</p>
            <p className="text-[10px]">Unidade: {selectedUnit?.name || '–'}</p>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-lg text-xs space-y-1">
          <p className="font-semibold text-foreground">O PDF inclui:</p>
          <p className="text-muted-foreground">✓ Identificação da unidade e período</p>
          <p className="text-muted-foreground">✓ Resumo executivo de conformidade (tabela colorida)</p>
          <p className="text-muted-foreground">✓ Controle de temperaturas dia a dia + registros fora da faixa</p>
          <p className="text-muted-foreground">✓ Histórico completo de não conformidades e ações corretivas</p>
          <p className="text-muted-foreground">✓ Monitoramentos HACCP / desvios de PCC</p>
          <p className="text-muted-foreground">✓ Registros de limpeza e trocas de óleo</p>
          <p className="text-muted-foreground">✓ Declaração de conformidade com assinatura</p>
        </div>

        <Button
          onClick={generatePDF}
          disabled={!isReady}
          className="w-full bg-primary hover:bg-primary/90 h-10"
          size="lg"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando PDF...</>
            : <><Download className="w-4 h-4 mr-2" />Baixar Parecer Técnico (PDF)</>}
        </Button>
      </CardContent>
    </Card>
  );
}
