import { useEffect, useState } from 'react';

type WhatsAppChannelPopupProps = {
  href: string;
};

const STORAGE_KEY = 'villa-cuiabar-whatsapp-channel-popup-dismissed-at';
const SHOW_DELAY_MS = 1200;
const REOPEN_AFTER_MS = 1000 * 60 * 60 * 24;

export const WhatsAppChannelPopup = ({ href }: WhatsAppChannelPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);

    if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < REOPEN_AFTER_MS) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/65 px-4 py-6 backdrop-blur-sm sm:items-center"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-channel-popup-title"
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-terracotta/20 bg-cream shadow-[0_30px_80px_rgba(51,35,19,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/10 bg-white/80 text-xl text-cocoa transition hover:bg-white"
          aria-label="Fechar convite do canal do WhatsApp"
        >
          ×
        </button>
        <div className="bg-gradient-to-r from-terracotta via-clay to-mustard px-6 py-5 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">WhatsApp</p>
          <h2 id="whatsapp-channel-popup-title" className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            📣 Entre no canal oficial do Villa Cuiabar
          </h2>
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-lg leading-relaxed text-cocoa/80">
            Receba no celular promocoes, descontos, ofertas, cardapio e avisos oficiais do restaurante.
          </p>
          <div className="rounded-[1.5rem] border border-cocoa/10 bg-white/70 p-4 text-base text-cocoa/75">
            🔥 Avisos rápidos, sem precisar procurar no Instagram ou no cardápio.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="btn-primary flex-1"
            >
              Entrar no canal
            </a>
            <button type="button" onClick={dismiss} className="btn-secondary flex-1">
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
