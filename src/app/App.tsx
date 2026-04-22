import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ClientRedirect } from '../components/ClientRedirect';
import { Layout } from '../components/Layout';

const HomePage = lazy(() => import('../pages/HomePage'));
const MenuPage = lazy(() => import('../pages/MenuPage'));
const ProRefeicaoPage = lazy(() => import('../pages/ProRefeicaoPage'));
const PedidosOnlinePage = lazy(() => import('../pages/PedidosOnlinePage'));
const PesquisaPage = lazy(() => import('../pages/PesquisaPage'));
const ReservasPage = lazy(() => import('../pages/ReservasPage'));
const AgendaPage = lazy(() => import('../pages/AgendaPage'));
const AgendaEventPage = lazy(() => import('../pages/AgendaEventPage'));
const BlogSubdomainRedirectPage = lazy(() => import('../pages/BlogSubdomainRedirectPage'));
const VagasPage = lazy(() => import('../pages/VagasPage'));
const BurguerCuiabarPage = lazy(() => import('../pages/BurguerCuiabarPage'));
const EspetariaCuiabarPage = lazy(() => import('../pages/EspetariaCuiabarPage'));
const LinksPage = lazy(() => import('../pages/LinksPage'));
const LocalGuidePage = lazy(() => import('../pages/LocalGuidePage'));

export const App = () => (
  <Suspense fallback={<div className="container-shell py-24">Carregando Villa Cuiabar...</div>}>
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bio" element={<ClientRedirect to="/links" />} />
        <Route path="/acessos" element={<ClientRedirect to="/links" />} />
        <Route path="/canal" element={<ClientRedirect to="/links" />} />
        <Route path="/asianrestaurant" element={<ClientRedirect to="/" />} />
        <Route path="/burger" element={<ClientRedirect to="/burguer" />} />
        <Route path="/burguer-cuiabar" element={<ClientRedirect to="/burguer" />} />
        <Route path="/burguer" element={<BurguerCuiabarPage />} />
        <Route path="/marmita" element={<ClientRedirect to="/pedidos-online" />} />
        <Route path="/delivery" element={<ClientRedirect to="/pedidos-online" />} />
        <Route path="/online-ordering" element={<ClientRedirect to="/pedidos-online" />} />
        <Route path="/services-5" element={<ClientRedirect to="/pedidos-online" />} />
        <Route path="/espetaria" element={<EspetariaCuiabarPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/agenda/:eventSlug" element={<AgendaEventPage />} />
        <Route path="/blog" element={<BlogSubdomainRedirectPage />} />
        <Route path="/blog/:slug" element={<BlogSubdomainRedirectPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/prorefeicao" element={<ProRefeicaoPage />} />
        <Route path="/pedidos-online" element={<PedidosOnlinePage />} />
        <Route path="/pesquisa" element={<PesquisaPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/restaurante-jardim-aurelia-campinas" element={<LocalGuidePage pageKey="jardimAureliaRestaurant" />} />
        <Route path="/bar-jardim-aurelia-musica-ao-vivo" element={<LocalGuidePage pageKey="jardimAureliaBar" />} />
        <Route path="/restaurante-perto-do-enxuto-dunlop" element={<LocalGuidePage pageKey="enxutoDunlop" />} />
        <Route path="/vagas" element={<VagasPage />} />
      </Routes>
    </Layout>
  </Suspense>
);
