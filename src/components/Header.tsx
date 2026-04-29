import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { navItems, siteConfig } from '../data/siteConfig';

const whatsAppHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`;

type HeaderProps = {
  hideWhatsAppActions?: boolean;
};

export const Header = ({ hideWhatsAppActions = false }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const visibleNavItems = hideWhatsAppActions ? navItems.filter((item) => !item.label.toLowerCase().includes('whatsapp') && !item.to.includes('wa.me')) : navItems;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-sand/40 bg-cream/90 shadow-[0_12px_40px_rgba(51,35,19,0.08)] backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link to="/presencial" className="group flex items-center gap-3 text-cocoa">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
            <img
              src={siteConfig.logoUrl}
              alt=""
              width={48}
              height={48}
              decoding="async"
              className="h-12 w-12 rounded-full object-cover transition duration-500 group-hover:rotate-6 group-hover:scale-105"
            />
          </span>
          <span className="font-heading text-xl leading-none sm:text-2xl">{siteConfig.brandShortName}</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {visibleNavItems.map((item) => (
            item.external ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                className={
                  item.variant === 'highlight'
                    ? 'inline-flex items-center rounded-full bg-[#ea533d] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(234,83,61,0.92)] transition hover:-translate-y-0.5 hover:bg-[#511215]'
                    : item.variant === 'outline'
                      ? 'inline-flex items-center rounded-full border border-gold/60 bg-gold/[0.08] px-4 py-2 text-sm font-semibold text-gold transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-cocoa'
                      : 'relative text-sm font-medium text-steel transition hover:text-cocoa after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-terracotta after:transition-transform after:duration-300 hover:after:scale-x-100'
                }
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  if (item.variant === 'highlight') {
                    return `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(234,83,61,0.92)] transition ${isActive ? 'bg-[#511215]' : 'bg-[#ea533d] hover:-translate-y-0.5 hover:bg-[#511215]'}`;
                  }
                  if (item.variant === 'outline') {
                    return `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-gold bg-gold text-cocoa shadow-[0_14px_30px_-16px_rgba(178,146,88,0.7)]' : 'border-gold/60 bg-gold/[0.08] text-gold hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-cocoa'}`;
                  }
                  return `relative text-sm font-medium transition after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:bg-terracotta after:transition-transform after:duration-300 ${isActive ? 'text-terracotta after:scale-x-100' : 'text-steel hover:text-cocoa after:scale-x-0 hover:after:scale-x-100'}`;
                }}
              >
                {item.label}
              </NavLink>
            )
          ))}
          {!hideWhatsAppActions ? (
            <a href={whatsAppHref} className="btn-primary" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
        </nav>
        <button onClick={() => setOpen((s) => !s)} className="rounded-full border border-sand/60 bg-white/80 p-2 text-cocoa transition hover:border-terracotta hover:text-terracotta md:hidden" aria-label="Abrir menu">
          <span className="text-2xl">☰</span>
        </button>
      </div>
      {open ? (
        <div className="panel-rise border-t border-sand/40 bg-white/95 p-4 backdrop-blur md:hidden">
          <div className="container-shell flex flex-col gap-3">
            {visibleNavItems.map((item) => (
              item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={
                    item.variant === 'highlight'
                      ? 'rounded-full bg-[#ea533d] px-4 py-2 text-center font-semibold text-white'
                      : item.variant === 'outline'
                        ? 'rounded-full border border-gold/60 bg-gold/[0.08] px-4 py-2 text-center font-semibold text-gold'
                        : 'text-steel'
                  }
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={
                    item.variant === 'highlight'
                      ? 'rounded-full bg-[#ea533d] px-4 py-2 text-center font-semibold text-white'
                      : item.variant === 'outline'
                        ? 'rounded-full border border-gold/60 bg-gold/[0.08] px-4 py-2 text-center font-semibold text-gold'
                        : 'text-steel'
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
            {!hideWhatsAppActions ? (
              <a href={whatsAppHref} className="btn-primary text-center" target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
};
