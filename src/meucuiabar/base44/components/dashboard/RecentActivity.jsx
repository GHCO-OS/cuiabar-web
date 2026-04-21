import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@meucuiabar/components/ui/card';
import { Thermometer, SprayCanIcon, Droplets, Salad, ClipboardCheck } from 'lucide-react';
import moment from 'moment';

export default function RecentActivity({ tempRecords, cleaningRecords, oilChanges, produceWashings }) {
  const activities = [
    ...(tempRecords || []).slice(0, 3).map(r => ({
      id: `t-${r.id}`, type: 'temp', icon: Thermometer,
      text: `Temperatura: ${r.temperature}°C`,
      time: r.recorded_at || r.created_date,
      color: r.is_conforming ? 'text-emerald-600' : 'text-red-600'
    })),
    ...(cleaningRecords || []).slice(0, 3).map(r => ({
      id: `c-${r.id}`, type: 'clean', icon: SprayCanIcon,
      text: `Limpeza: ${r.product_used}`,
      time: r.executed_at || r.created_date,
      color: 'text-blue-600'
    })),
    ...(oilChanges || []).slice(0, 3).map(r => ({
      id: `o-${r.id}`, type: 'oil', icon: Droplets,
      text: `Troca de Óleo`,
      time: r.changed_at || r.created_date,
      color: 'text-amber-600'
    })),
    ...(produceWashings || []).slice(0, 3).map(r => ({
      id: `p-${r.id}`, type: 'produce', icon: Salad,
      text: `Lavagem: ${r.item}`,
      time: r.start_time || r.created_date,
      color: 'text-emerald-600'
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada hoje</p>
        ) : (
          activities.map(a => (
            <div key={a.id} className="flex items-center gap-3 py-1.5">
              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${a.color}`}>
                <a.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{a.text}</p>
                <p className="text-[10px] text-muted-foreground">{moment(a.time).fromNow()}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}