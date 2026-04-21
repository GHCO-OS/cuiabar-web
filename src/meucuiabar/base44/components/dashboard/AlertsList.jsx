import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@meucuiabar/components/ui/card';
import StatusBadge from '@meucuiabar/components/shared/StatusBadge';
import { AlertTriangle, Clock } from 'lucide-react';
import moment from 'moment';

export default function AlertsList({ nonConformities, title = "Alertas Críticos" }) {
  const openNCs = nonConformities
    .filter(nc => nc.status !== 'resolvida')
    .sort((a, b) => {
      const severityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
      return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {openNCs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum alerta no momento</p>
        ) : (
          openNCs.map(nc => (
            <div key={nc.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{nc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={nc.severity} />
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {moment(nc.created_date).fromNow()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}