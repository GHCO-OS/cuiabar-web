import React from 'react';
import { Button } from '@meucuiabar/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@meucuiabar/utils';
import { Home } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <span className="text-2xl font-bold text-primary">404</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground mb-6">A página que você procura não existe ou foi movida.</p>
      <Link to={createPageUrl('Dashboard')}>
        <Button className="bg-primary hover:bg-primary/90">
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </Link>
    </div>
  );
}