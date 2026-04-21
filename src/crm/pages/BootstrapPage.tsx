import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmRequest } from '../api';
import { Button, Field, InputClassName, Panel } from '../components';

export const BootstrapPage = ({
  onCompleted,
  loginPath = '/login',
  productLabel = 'Cuiabar Atende',
  productDescription = 'Use o token de bootstrap definido como secret no Cloudflare para liberar o primeiro acesso administrativo do modulo de atendimento e relacionamento.',
}: {
  onCompleted: () => Promise<void>;
  loginPath?: string;
  productLabel?: string;
  productDescription?: string;
}) => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [displayName, setDisplayName] = useState(`Gerente ${productLabel}`);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await crmRequest('/api/bootstrap/admin', {
        method: 'POST',
        body: JSON.stringify({ token, displayName, email, password }),
      });
      navigate(loginPath);
      await onCompleted();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao criar o usuario inicial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_20%),linear-gradient(140deg,#020617,#111827_50%,#1e293b)] px-4 py-10">
      <Panel className="w-full max-w-2xl space-y-6 border-amber-300/20 bg-slate-950/80 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Primeira configuracao</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Criar gerente inicial do {productLabel}</h1>
          <p className="mt-2 text-sm text-slate-300">{productDescription}</p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Token de bootstrap" hint="Secret de instalacao inicial">
            <input className={InputClassName} value={token} onChange={(event) => setToken(event.target.value)} required />
          </Field>
          <Field label="Nome exibido">
            <input className={InputClassName} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </Field>
          <Field label="E-mail" hint="Conta gerente">
            <input className={InputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Senha" hint="Minimo de 10 caracteres">
            <input className={InputClassName} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          {error ? <p className="md:col-span-2 text-sm text-rose-300">{error}</p> : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Criando gerente...' : 'Concluir bootstrap'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
};
