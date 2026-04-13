import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';

type RuntimeAppKey = 'site' | 'crm' | 'reservas';

const getRuntimeAppKey = (): RuntimeAppKey => {
  const hostname = window.location.hostname.toLowerCase();
  const forcedApp = new URLSearchParams(window.location.search).get('app');

  if (forcedApp === 'crm' || hostname === 'crm.cuiabar.com') {
    return 'crm';
  }

  if (forcedApp === 'reservas' || hostname === 'reservas.cuiabar.com') {
    return 'reservas';
  }

  return 'site';
};

const runtimeAppKey = getRuntimeAppKey();

const RootApp =
  runtimeAppKey === 'crm'
    ? lazy(() => import('./crm/CrmApp').then((module) => ({ default: () => <module.CrmApp /> })))
    : runtimeAppKey === 'reservas'
      ? lazy(() => import('./reservations/ReservationsApp').then((module) => ({ default: module.ReservationsApp })))
      : lazy(() => import('./app/App').then((module) => ({ default: module.App })));

const fallbackLabel =
  runtimeAppKey === 'crm' ? 'Carregando CRM...' : runtimeAppKey === 'reservas' ? 'Carregando reservas...' : 'Carregando Villa Cuiabar...';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="container-shell py-24 text-center text-cocoa">{fallbackLabel}</div>}>
        <RootApp />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
