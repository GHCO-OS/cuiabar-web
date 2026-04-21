import { WhatsAppChannelPopup } from '../components/WhatsAppChannelPopup';
import { getRouteSeo } from '../data/seo';
import { WhatsAppContactCard } from '../components/WhatsAppContactCard';
import { AgendaPreviewSection } from '../sections/AgendaPreviewSection';
import { DifferentialsSection } from '../sections/DifferentialsSection';
import { HeroSection } from '../sections/HeroSection';
import { LocalSignalsSection } from '../sections/LocalSignalsSection';
import { MenuHighlightsSection } from '../sections/MenuHighlightsSection';
import { ProRefeicaoSection } from '../sections/ProRefeicaoSection';
import { siteConfig } from '../data/siteConfig';
import { useSeo } from '../hooks/useSeo';

const HomePage = () => {
  const reservationHref = siteConfig.reservationPortalUrl;

  useSeo(getRouteSeo('/'));

  return (
    <>
      <WhatsAppChannelPopup href={siteConfig.whatsappChannelUrl} />
      <HeroSection />
      <DifferentialsSection />
      <LocalSignalsSection />
      <AgendaPreviewSection />
      <ProRefeicaoSection />
      <MenuHighlightsSection />
      <section className="container-shell py-12">
        <WhatsAppContactCard
          title="Reservas online no portal oficial"
          description="Escolha data, horário, quantidade de pessoas e preferências da mesa em um fluxo próprio, rápido e organizado."
          href={reservationHref}
          buttonLabel="Reservar online"
          note="Se precisar ajustar algum detalhe com a equipe, o WhatsApp oficial continua disponível para apoio."
        />
      </section>
    </>
  );
};

export default HomePage;
