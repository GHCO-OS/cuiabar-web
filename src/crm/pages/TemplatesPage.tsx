import { useEffect, useMemo, useRef, useState } from 'react';
import { crmRequest } from '../api';
import { ConfirmModal, Panel } from '../components';
import { useCrm } from '../context';
import { defaultEmailTemplatePreset, emailTemplatePresets } from '../emailPresets';
import type { Template } from '../types';

type TemplateFormState = {
  name: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

type FeedbackTone = 'success' | 'danger' | 'neutral';

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
} | null;

const RESERVED_VARIABLES = ['first_name', 'last_name', 'email', 'unsubscribe_url', 'campaign_name', 'reply_to'] as const;

const BLANK_TEMPLATE_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Template Cuiabar</title>
  </head>
  <body style="margin:0;padding:0;background:#efe5d8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#efe5d8;">
      {{campaign_name}}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#efe5d8;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#fffaf4;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#3f2416;">
                <img src="https://cuiabar.com/logo-villa-cuiabar.png" alt="Villa Cuiabar" width="84" style="display:block;width:84px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:32px;line-height:1.08;color:#2f1c12;">Ola {{first_name}},</h1>
                <p style="margin:0 0 14px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.7;color:#5c4738;">Edite este rascunho com a campanha que voce quer disparar pelo CRM do Cuiabar.</p>
                <p style="margin:0 0 20px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.7;color:#5c4738;">Use imagens com URL absoluta, CTA claro e um texto simples tambem no modo plain text.</p>
                <a href="https://cuiabar.com" target="_blank" rel="noreferrer" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#b45b30;color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:700;text-decoration:none;">Abrir site</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <img src="https://cuiabar.com/menu/picanha-carreteira.png" alt="Prato do Villa Cuiabar" width="576" style="display:block;width:100%;max-width:576px;height:auto;border-radius:20px;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px;background:#3a2317;">
                <p style="margin:0 0 10px;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.7;color:#f3e4d5;">Campanha: {{campaign_name}}</p>
                <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:1.7;color:#f3e4d5;">Descadastrar: <a href="{{unsubscribe_url}}" style="color:#f3e4d5;text-decoration:underline;">{{unsubscribe_url}}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const BLANK_TEMPLATE_TEXT = `Ola {{first_name}},

Edite este rascunho com a campanha que voce quer disparar pelo CRM do Cuiabar.

CTA principal: https://cuiabar.com
Reply-To sugerido: {{reply_to}}

Descadastrar: {{unsubscribe_url}}`;

const previewDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const normalizeForSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const extractMergeVariables = (source: string) => {
  const names = new Set<string>();

  for (const match of source.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
    if (match[1]) {
      names.add(match[1]);
    }
  }

  return [...names];
};

const applyMergeTags = (source: string, context: Record<string, string>) =>
  source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, rawName: string) => context[rawName] ?? '');

const toPreviewDocument = (html: string, context: Record<string, string>) => {
  let merged = applyMergeTags(html, context);

  if (typeof window !== 'undefined') {
    const previewOrigin = window.location.origin.replace(/\/$/, '');
    merged = merged
      .replace(/https:\/\/www\.cuiabar\.com\//gi, `${previewOrigin}/`)
      .replace(/https:\/\/cuiabar\.com\//gi, `${previewOrigin}/`);
  }

  if (/<html[\s>]/i.test(merged)) {
    return merged;
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body style="margin:0;background:#f3f4f6;">${merged}</body></html>`;
};

const createBlankForm = (): TemplateFormState => ({
  name: '',
  subject: '',
  preheader: '',
  html: BLANK_TEMPLATE_HTML,
  text: BLANK_TEMPLATE_TEXT,
});

const createFormFromPreset = (preset = defaultEmailTemplatePreset): TemplateFormState => ({
  name: preset.name,
  subject: preset.subject,
  preheader: preset.preheader,
  html: preset.html,
  text: preset.text,
});

const createFormFromTemplate = (template: Template): TemplateFormState => ({
  name: template.name,
  subject: template.subject,
  preheader: template.preheader,
  html: template.html,
  text: template.text,
});

const duplicateTemplateDraft = (template: Template): TemplateFormState => ({
  name: `${template.name} copia`,
  subject: template.subject,
  preheader: template.preheader,
  html: template.html,
  text: template.text,
});

const feedbackClassName = (tone: FeedbackTone) =>
  tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-50 text-slate-700';

const LightPanel = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => (
  <Panel className={`border-slate-200 bg-white text-slate-900 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)] ${className}`}>{children}</Panel>
);

const LightPageHeader = ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
    </div>
    {action ? <div className="flex-shrink-0">{action}</div> : null}
  </div>
);

const LightBadge = ({ children, tone = 'neutral' }: React.PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' }>) => {
  const styles =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-slate-100 text-slate-600';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>{children}</span>;
};

const LightButton = ({
  children,
  type = 'button',
  variant = 'primary',
  ...props
}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }>) => {
  const styles =
    variant === 'primary'
      ? 'border border-sky-600 bg-sky-600 text-white hover:bg-sky-700'
      : variant === 'danger'
        ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';

  return (
    <button
      type={type}
      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${styles} disabled:cursor-not-allowed disabled:opacity-50`}
      {...props}
    >
      {children}
    </button>
  );
};

const LightField = ({
  label,
  children,
  hint,
}: React.PropsWithChildren<{ label: string; hint?: string }>) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium text-slate-900">{label}</span>
    {children}
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </label>
);

const LightInputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500';

const LightMetricCard = ({ label, value, note }: { label: string; value: string | number; note?: string }) => (
  <LightPanel className="border border-slate-200 bg-white">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
  </LightPanel>
);

export const TemplatesPage = () => {
  const { csrfToken } = useCrm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState<TemplateFormState>(() => createFormFromPreset());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(defaultEmailTemplatePreset.id);
  const [testEmails, setTestEmails] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');

  const load = async () => {
    const response = await crmRequest<{ ok: true; templates: Template[] }>('/api/templates', {}, csrfToken);
    setTemplates(response.templates);
    return response.templates;
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [csrfToken]);

  const activePreset = useMemo(
    () => emailTemplatePresets.find((preset) => preset.id === activePresetId) ?? null,
    [activePresetId],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const currentVariables = useMemo(
    () => Array.from(new Set([...extractMergeVariables(form.html), ...extractMergeVariables(form.text), ...RESERVED_VARIABLES])).sort(),
    [form.html, form.text],
  );

  const previewContext = useMemo(
    () => ({
      first_name: 'Marina',
      last_name: 'Souza',
      email: 'marina@exemplo.com',
      campaign_name: form.name || activePreset?.name || 'Newsletter Cuiabar',
      unsubscribe_url: 'https://crm.cuiabar.com/unsubscribe/exemplo',
      reply_to: 'contato@cuiabar.com',
    }),
    [activePreset?.name, form.name],
  );

  const previewDocument = useMemo(() => toPreviewDocument(form.html, previewContext), [form.html, previewContext]);
  const previewText = useMemo(() => applyMergeTags(form.text, previewContext), [form.text, previewContext]);

  const normalizedSearch = normalizeForSearch(librarySearch);

  const filteredPresets = useMemo(() => {
    if (!normalizedSearch) return emailTemplatePresets;

    return emailTemplatePresets.filter((preset) =>
      normalizeForSearch([preset.name, preset.category, preset.summary, preset.idealFor, preset.tags.join(' ')].join(' ')).includes(normalizedSearch),
    );
  }, [normalizedSearch]);

  const filteredTemplates = useMemo(() => {
    if (!normalizedSearch) return templates;

    return templates.filter((template) =>
      normalizeForSearch([template.name, template.subject, template.preheader, template.variables.join(' ')].join(' ')).includes(normalizedSearch),
    );
  }, [normalizedSearch, templates]);

  const startBlankDraft = () => {
    setSelectedTemplateId(null);
    setActivePresetId(null);
    setForm(createBlankForm());
    setFeedback({ tone: 'neutral', message: 'Editor limpo para um novo rascunho.' });
  };

  const applyPreset = (presetId: string) => {
    const preset = emailTemplatePresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setSelectedTemplateId(null);
    setActivePresetId(preset.id);
    setForm(createFormFromPreset(preset));
    setFeedback({ tone: 'success', message: `Preset "${preset.name}" carregado no editor.` });
  };

  const editSavedTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setActivePresetId(null);
    setForm(createFormFromTemplate(template));
    setFeedback({ tone: 'neutral', message: `Template "${template.name}" aberto para edicao.` });
  };

  const duplicateSavedTemplate = (template: Template) => {
    setSelectedTemplateId(null);
    setActivePresetId(null);
    setForm(duplicateTemplateDraft(template));
    setFeedback({ tone: 'neutral', message: `Template "${template.name}" clonado para um novo rascunho.` });
  };

  const importHtmlFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const html = await file.text();
      const inferredName = file.name.replace(/\.[^.]+$/, '');
      setSelectedTemplateId(null);
      setActivePresetId(null);
      setForm((current) => ({
        ...current,
        name: current.name || inferredName,
        subject: current.subject || inferredName,
        html,
      }));
      setFeedback({ tone: 'success', message: `HTML importado de "${file.name}" para o editor.` });
    } catch {
      setFeedback({ tone: 'danger', message: 'Nao foi possivel importar o arquivo HTML.' });
    }
  };

  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (selectedTemplateId) {
        await crmRequest(
          `/api/templates/${selectedTemplateId}`,
          {
            method: 'PUT',
            body: JSON.stringify(form),
          },
          csrfToken,
        );
        await load();
        setFeedback({ tone: 'success', message: 'Template atualizado no CRM.' });
      } else {
        const response = await crmRequest<{ ok: true; templateId: string }>(
          '/api/templates',
          {
            method: 'POST',
            body: JSON.stringify(form),
          },
          csrfToken,
        );
        await load();
        setSelectedTemplateId(response.templateId);
        setActivePresetId(null);
        setFeedback({ tone: 'success', message: 'Novo template salvo no CRM.' });
      }
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Nao foi possivel salvar o template.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTest = async (templateId: string) => {
    const emails = testEmails
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!emails.length) {
      setFeedback({ tone: 'danger', message: 'Informe pelo menos um e-mail de teste separado por virgula.' });
      return;
    }

    setSendingTemplateId(templateId);
    setFeedback(null);

    try {
      await crmRequest(
        `/api/templates/${templateId}/test-send`,
        {
          method: 'POST',
          body: JSON.stringify({ emails }),
        },
        csrfToken,
      );
      setFeedback({ tone: 'success', message: `Teste enviado para ${emails.length} destinatario(s).` });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Nao foi possivel disparar o teste.',
      });
    } finally {
      setSendingTemplateId(null);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await crmRequest(`/api/templates/${templateId}`, { method: 'DELETE' }, csrfToken);
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
        setForm(createBlankForm());
      }
      setDeletingTemplateId(null);
      await load();
      setFeedback({ tone: 'success', message: 'Template excluido com sucesso.' });
    } catch (error) {
      setDeletingTemplateId(null);
      setFeedback({ tone: 'danger', message: error instanceof Error ? error.message : 'Nao foi possivel excluir o template.' });
    }
  };

  const editorLabel = selectedTemplate
    ? `Editando: ${selectedTemplate.name}`
    : activePreset
      ? `Preset carregado: ${activePreset.name}`
      : 'Novo rascunho';

  return (
    <div className="space-y-6">
      <LightPageHeader
        title="Templates"
        description="Biblioteca mais objetiva para escolher um preset, importar HTML, abrir um template salvo e editar tudo no mesmo lugar."
        action={
          <div className="flex flex-wrap gap-3">
            <LightButton type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Importar HTML
            </LightButton>
            <LightButton type="button" variant="ghost" onClick={startBlankDraft}>
              Novo rascunho
            </LightButton>
          </div>
        }
      />

      <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={importHtmlFile} />

      <div className="grid gap-4 md:grid-cols-4">
        <LightMetricCard label="Biblioteca" value={emailTemplatePresets.length} note="Presets prontos para importar no editor." />
        <LightMetricCard label="Templates salvos" value={templates.length} note="Base atual do CRM para reaproveitar e ajustar." />
        <LightMetricCard label="Variaveis" value={currentVariables.length} note="Merge tags detectadas no rascunho atual." />
        <LightMetricCard label="Fluxo rapido" value="3 passos" note="Escolher ou importar, revisar, salvar." />
      </div>

      {feedback ? <div className={`rounded-3xl border px-4 py-3 text-sm ${feedbackClassName(feedback.tone)}`}>{feedback.message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <div className="space-y-6">
          <LightPanel className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Biblioteca</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Presets e templates salvos</h2>
                <p className="mt-2 text-sm text-slate-500">Encontre um preset, importe um HTML ou puxe um template salvo para o editor.</p>
              </div>
              <div className="w-full max-w-md">
                <input
                  className={LightInputClassName}
                  placeholder="Buscar por nome, categoria, assunto ou tag"
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <strong className="text-slate-900">Fluxo sugerido:</strong> escolha um preset da biblioteca, importe um HTML pronto ou abra um template salvo. Depois revise assunto, preheader e HTML no editor ao lado.
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Presets</h3>
                <LightBadge tone="success">{filteredPresets.length} encontrado(s)</LightBadge>
              </div>

              <div className="grid gap-3">
                {filteredPresets.map((preset) => {
                  const isActive = activePresetId === preset.id;

                  return (
                    <article key={preset.id} className={`rounded-[24px] border p-4 transition ${isActive ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <LightBadge tone={preset.id === 'prorefeicao-leonardo-comercial' ? 'warning' : 'neutral'}>{preset.category}</LightBadge>
                            {preset.id === 'prorefeicao-leonardo-comercial' ? <LightBadge tone="success">Novo preset</LightBadge> : null}
                          </div>
                          <h4 className="mt-3 text-base font-semibold text-slate-900">{preset.name}</h4>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{preset.summary}</p>
                        </div>
                        <div className="flex gap-2">
                          {preset.palettePreview.map((color) => (
                            <span key={color} className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {preset.tags.map((tag) => (
                          <LightBadge key={tag}>{tag}</LightBadge>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <LightButton type="button" onClick={() => applyPreset(preset.id)} disabled={isActive}>
                          {isActive ? 'Carregado' : 'Abrir no editor'}
                        </LightButton>
                        <LightButton type="button" variant="ghost" onClick={() => setPreviewMode('desktop')}>
                          Ver preview
                        </LightButton>
                      </div>
                    </article>
                  );
                })}

                {!filteredPresets.length ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                    Nenhum preset bateu com a busca atual.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Templates salvos</h3>
                <LightBadge>{filteredTemplates.length} encontrado(s)</LightBadge>
              </div>

              <LightField label="Destinatarios de teste" hint="Use esta lista para disparar testes rapidos a partir de qualquer template salvo.">
                <input className={LightInputClassName} value={testEmails} onChange={(event) => setTestEmails(event.target.value)} placeholder="teste@empresa.com, time@cuiabar.com" />
              </LightField>

              <div className="grid gap-3">
                {filteredTemplates.map((template) => (
                  <article key={template.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{template.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{template.subject}</p>
                        <p className="mt-2 text-xs text-slate-500">Atualizado em {previewDateFormatter.format(new Date(template.updatedAt))}</p>
                      </div>
                      <LightBadge tone={selectedTemplateId === template.id ? 'success' : 'neutral'}>{selectedTemplateId === template.id ? 'No editor' : 'Salvo'}</LightBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.variables.slice(0, 5).map((variable) => (
                        <LightBadge key={variable}>{variable}</LightBadge>
                      ))}
                      {template.variables.length > 5 ? <LightBadge>+{template.variables.length - 5}</LightBadge> : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <LightButton type="button" onClick={() => editSavedTemplate(template)}>
                        Abrir no editor
                      </LightButton>
                      <LightButton type="button" variant="ghost" onClick={() => duplicateSavedTemplate(template)}>
                        Clonar
                      </LightButton>
                      <LightButton type="button" variant="ghost" disabled={sendingTemplateId === template.id} onClick={() => sendTest(template.id)}>
                        {sendingTemplateId === template.id ? 'Enviando...' : 'Enviar teste'}
                      </LightButton>
                      <LightButton type="button" variant="danger" onClick={() => setDeletingTemplateId(template.id)}>
                        Excluir
                      </LightButton>
                    </div>
                  </article>
                ))}

                {!filteredTemplates.length ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                    Nenhum template salvo bateu com a busca atual.
                  </div>
                ) : null}
              </div>
            </div>
          </LightPanel>
        </div>

        <div className="space-y-6">
          <LightPanel className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Editor</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{editorLabel}</h2>
                <p className="mt-2 text-sm text-slate-500">Edite HTML, plain text, assunto e preheader no mesmo fluxo.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <LightButton type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                  Importar HTML
                </LightButton>
                <LightButton type="button" variant="ghost" onClick={startBlankDraft}>
                  Limpar editor
                </LightButton>
              </div>
            </div>

            <form className="grid gap-4" onSubmit={saveTemplate}>
              <div className="grid gap-4 lg:grid-cols-2">
                <LightField label="Nome do template">
                  <input className={LightInputClassName} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </LightField>

                <LightField label="Assunto">
                  <input className={LightInputClassName} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
                </LightField>
              </div>

              <LightField label="Preheader" hint="Linha complementar do assunto, usada por muitos clientes de email.">
                <input className={LightInputClassName} value={form.preheader} onChange={(event) => setForm((current) => ({ ...current, preheader: event.target.value }))} />
              </LightField>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Variaveis detectadas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentVariables.map((variable) => (
                    <LightBadge key={variable}>{variable}</LightBadge>
                  ))}
                </div>
              </div>

              <LightField label="HTML" hint="Cole o HTML completo ou importe um arquivo. O preview ao lado atualiza automaticamente.">
                <textarea className={`${LightInputClassName} min-h-[360px] font-mono text-xs leading-6`} value={form.html} onChange={(event) => setForm((current) => ({ ...current, html: event.target.value }))} />
              </LightField>

              <LightField label="Texto simples" hint="Versao plain text do template para fallback e consistencia da mensagem.">
                <textarea className={`${LightInputClassName} min-h-[220px] font-mono text-xs leading-6`} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} />
              </LightField>

              <div className="flex flex-wrap gap-3">
                <LightButton type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : selectedTemplateId ? 'Atualizar template' : 'Salvar como novo'}
                </LightButton>
                {selectedTemplate ? (
                  <LightButton type="button" variant="ghost" onClick={() => duplicateSavedTemplate(selectedTemplate)}>
                    Clonar como novo
                  </LightButton>
                ) : null}
              </div>
            </form>
          </LightPanel>

          <LightPanel className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Preview</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Leitura rapida do email</h2>
                <p className="mt-2 text-sm text-slate-500">Revise assunto, merge tags e layout antes de salvar ou enviar um teste.</p>
              </div>

              <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${previewMode === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${previewMode === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assunto</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{form.subject || 'Sem assunto ainda'}</p>
                  <p className="mt-2 text-sm text-slate-500">{form.preheader || 'Sem preheader no momento.'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  <p>Para: {previewContext.first_name} &lt;{previewContext.email}&gt;</p>
                  <p className="mt-1">Reply-To: {previewContext.reply_to}</p>
                </div>
              </div>

              <div className={`pt-5 transition-all ${previewMode === 'mobile' ? 'mx-auto max-w-[390px]' : 'w-full'}`}>
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_70px_-50px_rgba(15,23,42,0.45)]">
                  <iframe title="Preview do template" srcDoc={previewDocument} sandbox="" className="h-[780px] w-full bg-white" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.88fr,1.12fr]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Merge tags de exemplo</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <span className="text-slate-500">first_name:</span> {previewContext.first_name}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <span className="text-slate-500">campaign_name:</span> {previewContext.campaign_name}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <span className="text-slate-500">reply_to:</span> {previewContext.reply_to}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Plain text renderizado</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-4 py-4 font-mono text-xs leading-6 text-slate-700">{previewText}</pre>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <strong className="text-slate-900">Importacao e edicao:</strong> use <code>Importar HTML</code> para trazer um arquivo pronto, <code>Abrir no editor</code> para ajustar um template salvo e <code>Salvar como novo</code> quando quiser criar uma variacao sem sobrescrever o original.
            </div>
          </LightPanel>
        </div>
      </div>

      <ConfirmModal
        open={deletingTemplateId !== null}
        title="Excluir template"
        description={`Tem certeza que deseja excluir o template "${templates.find((t) => t.id === deletingTemplateId)?.name ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isDanger
        onConfirm={() => { if (deletingTemplateId) deleteTemplate(deletingTemplateId); }}
        onCancel={() => setDeletingTemplateId(null)}
      />
    </div>
  );
};
