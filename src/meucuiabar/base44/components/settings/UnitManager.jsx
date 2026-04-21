import React, { useState } from 'react';
import { base44 } from '@meucuiabar/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@meucuiabar/components/ui/card';
import { Button } from '@meucuiabar/components/ui/button';
import { Input } from '@meucuiabar/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@meucuiabar/components/ui/dialog';
import { Label } from '@meucuiabar/components/ui/label';
import { Plus, Building2, Pencil, MapPin } from 'lucide-react';

export default function UnitManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', geo_radius_meters: 150 });
  const [editId, setEditId] = useState(null);
  const queryClient = useQueryClient();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const handleSave = async () => {
    if (editId) {
      await base44.entities.Unit.update(editId, form);
    } else {
      await base44.entities.Unit.create({ ...form, active: true });
    }
    setShowDialog(false);
    setForm({ name: '', address: '' });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['units'] });
  };

  const startEdit = (u) => {
    setForm({ name: u.name, address: u.address || '', latitude: u.latitude || '', longitude: u.longitude || '', geo_radius_meters: u.geo_radius_meters || 150 });
    setEditId(u.id);
    setShowDialog(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Unidades</h3>
        <Button size="sm" variant="outline" onClick={() => { setForm({ name: '', address: '', latitude: '', longitude: '', geo_radius_meters: 150 }); setEditId(null); setShowDialog(true); }}>
          <Plus className="w-3 h-3 mr-1" />Nova
        </Button>
      </div>
      <div className="space-y-2">
        {units.map(u => (
          <Card key={u.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  {u.address && <p className="text-[10px] text-muted-foreground">{u.address}</p>}
                  {u.latitude && u.longitude
                    ? <p className="text-[10px] text-emerald-600 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />GPS configurado · raio {u.geo_radius_meters || 150}m</p>
                    : <p className="text-[10px] text-amber-600 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />GPS não configurado</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(u)}>
                <Pencil className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Unidade</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs">Endereço</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="mt-1" /></div>
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />Geolocalização (GPS)</p>
              <p className="text-[10px] text-muted-foreground">Configure as coordenadas para exigir check-in presencial dos operadores.</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px]">Latitude</Label><Input type="number" step="any" placeholder="-15.7801" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} className="mt-0.5 h-8 text-xs" /></div>
                <div><Label className="text-[10px]">Longitude</Label><Input type="number" step="any" placeholder="-47.9292" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} className="mt-0.5 h-8 text-xs" /></div>
              </div>
              <div><Label className="text-[10px]">Raio permitido (metros)</Label><Input type="number" placeholder="150" value={form.geo_radius_meters} onChange={e => setForm({...form, geo_radius_meters: parseInt(e.target.value) || 150})} className="mt-0.5 h-8 text-xs w-32" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button disabled={!form.name} onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}