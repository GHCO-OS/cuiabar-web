import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ClientRedirectProps = {
  to: string;
  replace?: boolean;
  title?: string;
};

export const ClientRedirect = ({ to, replace = true, title = 'Redirecionando...' }: ClientRedirectProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return (
    <section className="container-shell py-16">
      <div className="card max-w-2xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-terracotta">Atalho legado</p>
        <h1 className="mt-3 font-heading text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-steel">
          Estamos te levando para a rota atual. Se o redirecionamento nao acontecer automaticamente, siga pelo link abaixo.
        </p>
        <a href={to} className="btn-primary mt-6 inline-flex">
          Continuar para {to}
        </a>
        <p className="mt-4 text-sm text-steel">Origem: {location.pathname}</p>
      </div>
    </section>
  );
};
