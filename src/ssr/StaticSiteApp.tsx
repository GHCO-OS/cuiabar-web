import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import HomePage from '../pages/HomePage';
import MenuPage from '../pages/MenuPage';
import ProRefeicaoPage from '../pages/ProRefeicaoPage';
import PedidosOnlinePage from '../pages/PedidosOnlinePage';
import PesquisaPage from '../pages/PesquisaPage';
import ReservasPage from '../pages/ReservasPage';
import AgendaPage from '../pages/AgendaPage';
import AgendaEventPage from '../pages/AgendaEventPage';
import BlogSubdomainRedirectPage from '../pages/BlogSubdomainRedirectPage';
import VagasPage from '../pages/VagasPage';
import BurguerCuiabarPage from '../pages/BurguerCuiabarPage';
import EspetariaCuiabarPage from '../pages/EspetariaCuiabarPage';
import LinksPage from '../pages/LinksPage';
import LocalGuidePage from '../pages/LocalGuidePage';

export const StaticSiteApp = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/agenda/:eventSlug" element={<AgendaEventPage />} />
      <Route path="/blog" element={<BlogSubdomainRedirectPage />} />
      <Route path="/blog/:slug" element={<BlogSubdomainRedirectPage />} />
      <Route path="/burguer" element={<BurguerCuiabarPage />} />
      <Route path="/espetaria" element={<EspetariaCuiabarPage />} />
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
);
