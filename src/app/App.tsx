import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ClientRedirect } from '../components/ClientRedirect';
import { Layout } from '../components/Layout';
import { siteConfig } from '../data/siteConfig';

const HomePage = lazy(() => import('../pages/HomePage'));
const PresencialPage = lazy(() => import('../pages/PresencialPage'));
const MenuPage = lazy(() => import('../pages/MenuPage'));
const ProRefeicaoPage = lazy(() => import('../pages/ProRefeicaoPage'));
const ExpressoPage = lazy(() => import('../pages/ExpressoPage'));
const PesquisaPage = lazy(() => import('../pages/PesquisaPage'));
const ReservasPage = lazy(() => import('../pages/ReservasPage'));
const VagasPage = lazy(() => import('../pages/VagasPage'));
const BurgerNSmokePage = lazy(() => import('../pages/BurgerNSmokePage'));
const BurgerNSmokeSeoPage = lazy(() => import('../pages/BurgerNSmokeSeoPage'));
const EspetariaCuiabarPage = lazy(() => import('../pages/EspetariaCuiabarPage'));
const LinksPage = lazy(() => import('../pages/LinksPage'));
const LocalGuidePage = lazy(() => import('../pages/LocalGuidePage'));

const isProRefeicaoHost = () =>
  typeof window !== 'undefined' && window.location.hostname.toLowerCase() === 'prorefeicao.cuiabar.com';

const isBurgerNSmokeHost = () =>
  typeof window !== 'undefined' &&
  ['burgersnsmoke.com', 'www.burgersnsmoke.com'].includes(window.location.hostname.toLowerCase());

export const App = () => (
  <Suspense fallback={<div className="container-shell py-24">Carregando Villa Cuiabar...</div>}>
    <Layout>
      <Routes>
        <Route
          path="/"
          element={isProRefeicaoHost() ? <ProRefeicaoPage /> : isBurgerNSmokeHost() ? <BurgerNSmokePage /> : <HomePage />}
        />
        <Route path="/presencial" element={<PresencialPage />} />
        <Route path="/expresso" element={<ExpressoPage />} />
        <Route path="/bio" element={<ClientRedirect to="/links" />} />
        <Route path="/acessos" element={<ClientRedirect to="/links" />} />
        <Route path="/canal" element={<ClientRedirect to="/links" />} />
        <Route path="/asianrestaurant" element={<ClientRedirect to="/presencial" />} />
        <Route path="/burger" element={<ClientRedirect to={siteConfig.burgerNSmokeOrigin} />} />
        <Route path="/burguer-cuiabar" element={<ClientRedirect to={siteConfig.burgerNSmokeOrigin} />} />
        <Route path="/burguer" element={<ClientRedirect to={siteConfig.burgerNSmokeOrigin} />} />
        <Route path={siteConfig.burgerNSmokePreviewPath} element={<BurgerNSmokePage />} />
        <Route path="/hamburgueria-campinas" element={<BurgerNSmokeSeoPage pageKey="hamburgueriaCampinas" />} />
        <Route path="/smash-burger-campinas" element={<BurgerNSmokeSeoPage pageKey="smashBurgerCampinas" />} />
        <Route path="/burger-defumado-campinas" element={<BurgerNSmokeSeoPage pageKey="burgerDefumadoCampinas" />} />
        <Route path="/delivery-burger-campinas" element={<BurgerNSmokeSeoPage pageKey="deliveryBurgerCampinas" />} />
        <Route path="/marmita" element={<ClientRedirect to="/expresso" />} />
        <Route path="/delivery" element={<ClientRedirect to="/expresso" />} />
        <Route path="/online-ordering" element={<ClientRedirect to="/expresso" />} />
        <Route path="/services-5" element={<ClientRedirect to="/expresso" />} />
        <Route path="/espetaria" element={<EspetariaCuiabarPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/prorefeicao" element={<ClientRedirect to="https://prorefeicao.cuiabar.com" />} />
        <Route path="/pedidos-online" element={<ClientRedirect to="/expresso" />} />
        <Route path="/pesquisa" element={<PesquisaPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/restaurante-jardim-aurelia-campinas" element={<LocalGuidePage pageKey="jardimAureliaRestaurant" />} />
        <Route path="/restaurante-perto-do-enxuto-dunlop" element={<LocalGuidePage pageKey="enxutoDunlop" />} />
        <Route path="/vagas" element={<VagasPage />} />
      </Routes>
    </Layout>
  </Suspense>
);
