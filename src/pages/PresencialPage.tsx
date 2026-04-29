import { WhatsAppChannelPopup } from '../components/WhatsAppChannelPopup';
import { WhatsAppContactCard } from '../components/WhatsAppContactCard';
import { GoogleCalendarEmbed } from '../components/GoogleCalendarEmbed';
import { siteConfig } from '../data/siteConfig';
import { getRouteSeo } from '../data/seo';
import { useSeo } from '../hooks/useSeo';
import { DifferentialsSection } from '../sections/DifferentialsSection';
import { HeroSection } from '../sections/HeroSection';
import { LocalSignalsSection } from '../sections/LocalSignalsSection';
import { MenuHighlightsSection } from '../sections/MenuHighlightsSection';
import { ProRefeicaoSection } from '../sections/ProRefeicaoSection';

const PresencialPage = () => {
  const reservationHref = siteConfig.reservationPortalUrl;

  useSeo(getRouteSeo('/presencial'));

  return (
    <>
      <WhatsAppChannelPopup href={siteConfig.whatsappChannelUrl} />
      <HeroSection />
      <DifferentialsSection />
      <LocalSignalsSection />
      <section id="agenda-casa" className="container-shell py-12">
        <GoogleCalendarEmbed
          src={siteConfig.calendarEmbedUrl}
          title="Calendario oficial da casa"
          description="Use o calendario oficial do Google para consultar a programacao publicada pela equipe da casa."
        />
      </section>
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

export default PresencialPage;
