import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@meucuiabar/utils';
import { UnitProvider, useUnit } from '@meucuiabar/components/shared/UnitContext';
import { GeoGuardProvider } from '@meucuiabar/components/shared/GeoGuard';
import {
  LayoutDashboard,
  Thermometer,
  SprayCanIcon,
  Droplets,
  Salad,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  Menu,
  X,
  LogOut,
  Building2,
  ShieldCheck,
  FileBarChart2
} from 'lucide-react';
import { Button } from '@meucuiabar/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@meucuiabar/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@meucuiabar/components/ui/sheet';
import { cn } from '@meucuiabar/lib/utils';
import { useMeuCuiabarSession } from '@/meucuiabar/context';

const navItems = [
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { name: 'Temperaturas', page: 'Temperatures', icon: Thermometer },
  { name: 'Limpeza', page: 'Cleaning', icon: SprayCanIcon },
  { name: 'Troca de Óleo', page: 'OilChanges', icon: Droplets },
  { name: 'Hortifruti', page: 'ProduceWashing', icon: Salad },
  { name: 'Checklists', page: 'Checklists', icon: ClipboardCheck },
  { name: 'Não Conformidades', page: 'NonConformities', icon: AlertTriangle },
  { name: 'HACCP Digital', page: 'HACCPDigital', icon: ShieldCheck },
  { name: 'Relatórios', page: 'Relatorios', icon: FileBarChart2 },
];

const adminItems = [
  { name: 'Configurações', page: 'SettingsPage', icon: Settings },
];

function NavContent({ currentPageName, onNavigate }) {
  const { selectedUnitId, setSelectedUnitId, units, currentUser, isAdmin, isSupervisor } = useUnit();
  const { logout } = useMeuCuiabarSession();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CB</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">MeuCuiabar</h1>
            <p className="text-[11px] text-muted-foreground">Vigilância Sanitária</p>
          </div>
        </div>
        {units.length > 0 && (
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="h-9 text-xs bg-muted/50">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Selecione unidade" />
            </SelectTrigger>
            <SelectContent>
              {units.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Módulos</p>
        {navItems.map(item => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}

        {(isAdmin || isSupervisor) && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Gestão</p>
            {adminItems.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {currentUser?.full_name?.[0] || currentUser?.email?.[0] || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{currentUser?.full_name || currentUser?.email}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{currentUser?.role || 'operador'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={logout}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({ currentPageName }) {
  const mobileItems = navItems.slice(0, 5);
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {mobileItems.map(item => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 flex-1 transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium truncate">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <UnitProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 border-r border-border bg-card flex-col shrink-0 sticky top-0 h-screen">
          <NavContent currentPageName={currentPageName} onNavigate={() => {}} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">CB</span>
              </div>
              <span className="text-sm font-bold text-foreground">MeuCuiabar</span>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <NavContent currentPageName={currentPageName} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 max-w-6xl mx-auto w-full">
            <GeoGuardProvider>
              {children}
            </GeoGuardProvider>
          </main>
        </div>

        <MobileBottomNav currentPageName={currentPageName} />
      </div>
    </UnitProvider>
  );
}
