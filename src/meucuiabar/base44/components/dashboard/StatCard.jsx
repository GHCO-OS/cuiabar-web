import React from 'react';
import { Card } from '@meucuiabar/components/ui/card';
import { cn } from '@meucuiabar/lib/utils';

export default function StatCard({ label, value, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-red-100 text-red-600',
    accent: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}