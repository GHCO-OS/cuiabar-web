import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useMeuCuiabarSession } from '@/meucuiabar/context';
import { useQuery } from '@tanstack/react-query';

const UnitContext = createContext(null);

export function UnitProvider({ children }) {
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem('meucuiabar_unit') || '';
  });
  const { currentUser } = useMeuCuiabarSession();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.filter({ active: true }),
  });

  useEffect(() => {
    if (selectedUnitId && typeof window !== 'undefined') {
      window.localStorage.setItem('meucuiabar_unit', selectedUnitId);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    if (!selectedUnitId && units.length > 0) {
      if (currentUser?.unit_id) {
        setSelectedUnitId(currentUser.unit_id);
      } else {
        setSelectedUnitId(units[0].id);
      }
    }
  }, [units, currentUser, selectedUnitId]);

  const userRole = currentUser?.role || 'operador';
  const isAdmin = userRole === 'admin';
  const isSupervisor = userRole === 'supervisor' || isAdmin;

  return (
    <UnitContext.Provider value={{
      selectedUnitId,
      setSelectedUnitId,
      units,
      currentUser,
      userRole,
      isAdmin,
      isSupervisor
    }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnit must be used within UnitProvider');
  return ctx;
}
