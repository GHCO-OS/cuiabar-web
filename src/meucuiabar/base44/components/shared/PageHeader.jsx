import React from 'react';
import { Button } from '@meucuiabar/components/ui/button';
import { Plus } from 'lucide-react';

export default function PageHeader({ title, subtitle, onAdd, addLabel, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1.5" />
            {addLabel || 'Novo'}
          </Button>
        )}
      </div>
    </div>
  );
}