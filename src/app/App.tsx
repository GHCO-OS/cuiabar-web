import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';

const HomePage = lazy(() => import('../pages/HomePage'));
const MenuPage = lazy(() => import('../pages/MenuPage'));
const ProRefeicaoPage = lazy(() => import('../pages/ProRefeicaoPage'));
const PedidosOnlinePage = lazy(() => import('../pages/PedidosOnlinePage'));
const PesquisaPage = lazy(() => import('../pages/PesquisaPage'));
const ReservasPage = lazy(() => import('../pages/ReservasPage'));
const AgendaPage = lazy(() => import('../pages/AgendaPage'));
const AgendaEventPage = lazy(() => import('../pages/AgendaEventPage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
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
        <Route path="/bio" element={<Navigate to="/links" replace />} />
        <Route path="/acessos" element={<Navigate to="/links" replace />} />
        <Route path="/canal" element={<Navigate to="/links" replace />} />
        <Route path="/asianrestaurant" element={<Navigate to="/" replace />} />
        <Route path="/burger" element={<Navigate to="/burguer" replace />} />
        <Route path="/burguer-cuiabar" element={<Navigate to="/burguer" replace />} />
        <Route path="/burguer" element={<BurguerCuiabarPage />} />
        <Route path="/marmita" element={<Navigate to="/pedidos-online" replace />} />
        <Route path="/delivery" element={<Navigate to="/pedidos-online" replace />} />
        <Route path="/online-ordering" element={<Navigate to="/pedidos-online" replace />} />
        <Route path="/services-5" element={<Navigate to="/pedidos-online" replace />} />
        <Route path="/espetaria" element={<EspetariaCuiabarPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/agenda/:eventSlug" element={<AgendaEventPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
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
