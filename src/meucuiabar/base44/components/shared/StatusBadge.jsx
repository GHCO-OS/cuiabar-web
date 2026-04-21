import React from 'react';
import { Badge } from '@meucuiabar/components/ui/badge';
import { cn } from '@meucuiabar/lib/utils';

const variants = {
  conforme: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  nao_conforme: 'bg-red-100 text-red-700 border-red-200',
  aberta: 'bg-red-100 text-red-700 border-red-200',
  em_andamento: 'bg-amber-100 text-amber-700 border-amber-200',
  resolvida: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  critica: 'bg-red-100 text-red-800 border-red-300',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  baixa: 'bg-blue-100 text-blue-700 border-blue-200',
  pendente: 'bg-amber-100 text-amber-700 border-amber-200',
  atrasado: 'bg-red-100 text-red-700 border-red-200',
};

const labels = {
  conforme: 'Conforme',
  nao_conforme: 'Não Conforme',
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  resolvida: 'Resolvida',
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

export default function StatusBadge({ status, className }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border', variants[status] || 'bg-muted text-muted-foreground', className)}>
      {labels[status] || status}
    </Badge>
  );
}