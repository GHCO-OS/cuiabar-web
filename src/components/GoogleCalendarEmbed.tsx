type GoogleCalendarEmbedProps = {
  src: string;
  title?: string;
  description?: string;
};

const hasValidGoogleCalendar = (src: string) =>
  src.includes('calendar.google.com/calendar/embed') && !src.includes('SEU_CALENDARIO_PUBLICO_AQUI');

export const GoogleCalendarEmbed = ({ src, title, description }: GoogleCalendarEmbedProps) => (
  <section className="card p-6 sm:p-8">
    {title ? <h3 className="font-heading text-2xl text-cocoa">{title}</h3> : null}
    {description ? <p className="mt-2 text-steel">{description}</p> : null}
    <div className="mt-6 overflow-hidden rounded-2xl border border-sand/50">
      {hasValidGoogleCalendar(src) ? (
        <div className="relative h-0 w-full pb-[70%] md:pb-[50%]">
          <iframe
            src={src}
            className="absolute inset-0 h-full w-full"
            title="Calendario da casa Villa Cuiabar"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="flex min-h-64 items-center justify-center bg-sand/15 px-6 py-12 text-center">
          <div className="max-w-xl">
            <p className="font-heading text-2xl text-cocoa">Calendario em atualizacao</p>
            <p className="mt-3 text-steel">
              Defina uma URL publica do Google Calendar em <code>src/data/siteConfig.ts</code> para
              exibir o calendario automaticamente no site publicado.
            </p>
          </div>
        </div>
      )}
    </div>
  </section>
);
