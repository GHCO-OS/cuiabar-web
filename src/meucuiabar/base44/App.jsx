import { Toaster } from "@meucuiabar/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@meucuiabar/lib/query-client'
import { pagesConfig } from './pages.config'
import { Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { MEUCUIABAR_BASE_PATH } from '@meucuiabar/config';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const withBasePath = (path = '') => {
  const basePath = MEUCUIABAR_BASE_PATH || '';
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `${basePath}${normalizedPath}` || '/';
};

const mainRoutePath = withBasePath();
const shouldRedirectRoot = mainRoutePath !== '/';

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const MeuCuiabarRuntime = () => {
  return (
    <Routes>
      {shouldRedirectRoot ? <Route path="/" element={<Navigate to={mainRoutePath} replace />} /> : null}
      <Route path={mainRoutePath} element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={withBasePath(path)}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <MeuCuiabarRuntime />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
