import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import ExpressoPage from '../pages/ExpressoPage';
import HomePage from '../pages/HomePage';
import MenuPage from '../pages/MenuPage';
import ProRefeicaoPage from '../pages/ProRefeicaoPage';
import PedidosOnlinePage from '../pages/PedidosOnlinePage';
import PesquisaPage from '../pages/PesquisaPage';
import PresencialPage from '../pages/PresencialPage';
import ReservasPage from '../pages/ReservasPage';
import VagasPage from '../pages/VagasPage';
import BurgerNSmokePage from '../pages/BurgerNSmokePage';
import EspetariaCuiabarPage from '../pages/EspetariaCuiabarPage';
import LinksPage from '../pages/LinksPage';
import LocalGuidePage from '../pages/LocalGuidePage';

export const StaticSiteApp = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/presencial" element={<PresencialPage />} />
      <Route path="/expresso" element={<ExpressoPage />} />
      <Route path="/burger-n-smoke" element={<BurgerNSmokePage />} />
      <Route path="/espetaria" element={<EspetariaCuiabarPage />} />
      <Route path="/links" element={<LinksPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/prorefeicao" element={<ProRefeicaoPage />} />
      <Route path="/pedidos-online" element={<PedidosOnlinePage />} />
      <Route path="/pesquisa" element={<PesquisaPage />} />
      <Route path="/reservas" element={<ReservasPage />} />
      <Route path="/restaurante-jardim-aurelia-campinas" element={<LocalGuidePage pageKey="jardimAureliaRestaurant" />} />
      <Route path="/restaurante-perto-do-enxuto-dunlop" element={<LocalGuidePage pageKey="enxutoDunlop" />} />
      <Route path="/vagas" element={<VagasPage />} />
    </Routes>
  </Layout>
);
