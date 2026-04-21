import React from 'react';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import PageHeader from '@meucuiabar/components/shared/PageHeader';
import UnitManager from '@meucuiabar/components/settings/UnitManager';
import EquipmentManager from '@meucuiabar/components/settings/EquipmentManager';
import CleaningPlanManager from '@meucuiabar/components/settings/CleaningPlanManager';
import ChecklistManager from '@meucuiabar/components/settings/ChecklistManager';
import AccessApprovalManager from '@meucuiabar/components/settings/AccessApprovalManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@meucuiabar/components/ui/tabs';

export default function SettingsPage() {
  const { isAdmin, isSupervisor } = useUnit();

  if (!isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Acesso restrito a supervisores e administradores</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerenciamento de unidades, equipamentos e planos" />

      <Tabs defaultValue="units">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          <TabsTrigger value="cleaning">Planos Limpeza</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          {isAdmin ? <TabsTrigger value="access">Acessos</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="units"><UnitManager /></TabsContent>
        <TabsContent value="equipment"><EquipmentManager /></TabsContent>
        <TabsContent value="cleaning"><CleaningPlanManager /></TabsContent>
        <TabsContent value="checklists"><ChecklistManager /></TabsContent>
        {isAdmin ? <TabsContent value="access"><AccessApprovalManager /></TabsContent> : null}
      </Tabs>
    </div>
  );
}
