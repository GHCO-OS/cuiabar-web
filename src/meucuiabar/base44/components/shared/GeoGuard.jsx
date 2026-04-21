import React, { useState, useEffect, createContext, useContext } from 'react';
import { useUnit } from '@meucuiabar/components/shared/UnitContext';
import { Button } from '@meucuiabar/components/ui/button';
import { MapPin, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

const GeoContext = createContext({ verified: false, coords: null });

export function useGeo() {
  return useContext(GeoContext);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function GeoGuardProvider({ children }) {
  const { units, selectedUnitId, isAdmin, currentUser } = useUnit();
  const [status, setStatus] = useState('idle'); // idle | checking | verified | denied | no_geo | no_coords
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  // Admin bypasses geo check
  const isAdminUser = isAdmin;

  const unitHasCoords = selectedUnit?.latitude && selectedUnit?.longitude;

  const checkGeo = () => {
    if (!unitHasCoords) {
      setStatus('no_coords');
      return;
    }
    if (!navigator.geolocation) {
      setStatus('no_geo');
      return;
    }
    setStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        const dist = haversineDistance(latitude, longitude, selectedUnit.latitude, selectedUnit.longitude);
        setDistance(Math.round(dist));
        const radius = selectedUnit.geo_radius_meters || 150;
        if (dist <= radius) {
          setStatus('verified');
        } else {
          setStatus('denied');
        }
      },
      () => setStatus('no_geo'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (selectedUnitId && !isAdminUser) {
      setStatus('idle');
      setCoords(null);
      setDistance(null);
    }
  }, [selectedUnitId]);

  // Admin or unit without coords: pass through
  if (isAdminUser || !unitHasCoords || !selectedUnitId) {
    return (
      <GeoContext.Provider value={{ verified: true, coords }}>
        {children}
      </GeoContext.Provider>
    );
  }

  if (status === 'verified') {
    return (
      <GeoContext.Provider value={{ verified: true, coords }}>
        {children}
      </GeoContext.Provider>
    );
  }

  // Blocking screen
  return (
    <GeoContext.Provider value={{ verified: false, coords }}>
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
            status === 'denied' ? 'bg-red-100' :
            status === 'checking' ? 'bg-amber-100' :
            status === 'no_geo' ? 'bg-orange-100' :
            'bg-primary/10'
          }`}>
            {status === 'checking' ? <Loader2 className="w-9 h-9 text-amber-600 animate-spin" /> :
             status === 'denied' ? <AlertTriangle className="w-9 h-9 text-red-600" /> :
             status === 'no_geo' ? <MapPin className="w-9 h-9 text-orange-600" /> :
             <MapPin className="w-9 h-9 text-primary" />}
          </div>

          {status === 'idle' && (
            <>
              <h2 className="text-lg font-bold mb-2">Check-in na Unidade</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Para registrar operações em <strong>{selectedUnit?.name}</strong>, é necessário confirmar que você está fisicamente na unidade.
              </p>
              <Button onClick={checkGeo} className="w-full bg-primary">
                <MapPin className="w-4 h-4 mr-2" />Verificar Localização
              </Button>
            </>
          )}

          {status === 'checking' && (
            <>
              <h2 className="text-lg font-bold mb-2">Verificando localização...</h2>
              <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos sua posição.</p>
            </>
          )}

          {status === 'denied' && (
            <>
              <h2 className="text-lg font-bold text-red-700 mb-2">Fora da Unidade</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Você está a <strong>{distance}m</strong> de distância de <strong>{selectedUnit?.name}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Raio permitido: {selectedUnit?.geo_radius_meters || 150}m. Aproxime-se da unidade para continuar.
              </p>
              <Button onClick={checkGeo} variant="outline" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />Tentar Novamente
              </Button>
            </>
          )}

          {status === 'no_geo' && (
            <>
              <h2 className="text-lg font-bold text-orange-700 mb-2">Localização Não Disponível</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Permita o acesso à localização no seu navegador/dispositivo e tente novamente.
              </p>
              <Button onClick={checkGeo} variant="outline" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />Tentar Novamente
              </Button>
            </>
          )}

          {status === 'no_coords' && (
            <>
              <h2 className="text-lg font-bold mb-2">Coordenadas não configuradas</h2>
              <p className="text-sm text-muted-foreground">
                A unidade <strong>{selectedUnit?.name}</strong> ainda não tem coordenadas GPS cadastradas. Peça ao administrador para configurar em Configurações → Unidades.
              </p>
            </>
          )}
        </div>
      </div>
    </GeoContext.Provider>
  );
}