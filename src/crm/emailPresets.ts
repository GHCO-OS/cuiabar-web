import { siteConfig } from '../data/siteConfig';

type EmailPalette = {
  page: string;
  surface: string;
  hero: string;
  heroText: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentSoftText: string;
  heading: string;
  body: string;
  muted: string;
  border: string;
  footer: string;
  footerText: string;
};

type EmailCta = {
  label: string;
  url: string;
};

type EmailSpotlight = {
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

type EmailPresetDefinition = {
  id: string;
  name: string;
  category: string;
  summary: string;
  idealFor: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  cta: EmailCta;
  secondaryCta?: EmailCta;
  heroImage: string;
  heroAlt: string;
  chips: string[];
  spotlights: EmailSpotlight[];
  footerNote: string;
  palette: EmailPalette;
  palettePreview: string[];
};

export type EmailTemplatePreset = {
  id: string;
  name: string;
  category: string;
  summary: string;
  idealFor: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  palettePreview: string[];
  tags: string[];
};

const SITE_ORIGIN = 'https://cuiabar.com';
const DEFAULT_TEXT = 'Arial, Helvetica, sans-serif';
const HOME_URL = SITE_ORIGIN;
const MENU_URL = `${SITE_ORIGIN}/menu`;
const PROREFEICAO_URL = siteConfig.prorefeicaoPageUrl;
const RESERVATION_URL = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent('Ola! Quero reservar uma mesa no Villa Cuiabar.')}`;
const COMMERCIAL_URL = `https://wa.me/${siteConfig.commercialWhatsappNumber}?text=${encodeURIComponent(siteConfig.commercialWhatsappMessage)}`;

const absoluteUrl = (value: string) => (/^https?:\/\//i.test(value) ? value : `${SITE_ORIGIN}${value}`);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderParagraphs = (paragraphs: string[], color: string) =>
  paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:${DEFAULT_TEXT};font-size:16px;line-height:1.7;color:${color};">${paragraph}</p>`,
    )
    .join('');

const renderButton = (cta: EmailCta, background: string, color: string, outlined = false) =>
  `<a href="${escapeHtml(cta.url)}" target="_blank" rel="noreferrer" style="display:inline-block;margin:0 12px 12px 0;padding:14px 22px;border-radius:999px;border:1px solid ${outlined ? background : 'transparent'};background:${outlined ? 'transparent' : background};color:${color};font-family:${DEFAULT_TEXT};font-size:14px;font-weight:700;letter-spacing:0.02em;text-decoration:none;">${escapeHtml(cta.label)}</a>`;

const renderChips = (chips: string[], palette: EmailPalette) =>
  chips
    .map(
      (chip) =>
        `<span style="display:inline-block;margin:0 8px 8px 0;padding:9px 14px;border-radius:999px;background:${palette.accentSoft};color:${palette.accentSoftText};font-family:${DEFAULT_TEXT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(chip)}</span>`,
    )
    .join('');

const renderSpotlights = (spotlights: EmailSpotlight[], palette: EmailPalette) =>
  spotlights
    .map(
      (spotlight) => `
        <tr>
          <td style="padding:0 0 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid ${palette.border};border-radius:24px;background:${palette.surface};">
              <tr>
                <td style="padding:18px 18px 10px;">
                  <span style="display:inline-block;margin-bottom:12px;padding:7px 12px;border-radius:999px;background:${palette.accentSoft};color:${palette.accentSoftText};font-family:${DEFAULT_TEXT};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(spotlight.label)}</span>
                  <img src="${escapeHtml(absoluteUrl(spotlight.image))}" alt="${escapeHtml(spotlight.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:18px;border:0;" />
                  <h3 style="margin:18px 0 8px;font-family:${DEFAULT_TEXT};font-size:22px;line-height:1.2;color:${palette.heading};">${escapeHtml(spotlight.title)}</h3>
                  <p style="margin:0;font-family:${DEFAULT_TEXT};font-size:15px;line-height:1.7;color:${palette.body};">${escapeHtml(spotlight.description)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join('');

const buildHtml = (definition: EmailPresetDefinition) => {
  const { palette } = definition;
  const secondaryButton = definition.secondaryCta
    ? renderButton(definition.secondaryCta, palette.accent, palette.accent, true)
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(definition.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${palette.page};">
      ${escapeHtml(definition.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:${palette.page};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:${palette.surface};border-radius:32px;overflow:hidden;">
            <tr>
              <td style="padding:26px 32px;background:${palette.hero};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
                  <tr>
                    <td style="vertical-align:top;">
                      <a href="${HOME_URL}" target="_blank" rel="noreferrer" style="text-decoration:none;">
                        <img src="${escapeHtml(absoluteUrl(siteConfig.logoUrl))}" alt="${escapeHtml(siteConfig.brandShortName)}" width="88" style="display:block;width:88px;height:auto;border:0;" />
                      </a>
                    </td>
                    <td align="right" style="vertical-align:top;">
                      <p style="margin:0 0 10px;font-family:${DEFAULT_TEXT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${palette.heroText};">${escapeHtml(definition.eyebrow)}</p>
                      <p style="margin:0;font-family:${DEFAULT_TEXT};font-size:11px;line-height:1.5;color:${palette.heroText};">Campanha: {{campaign_name}}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 18px;">
                <span style="display:inline-block;margin-bottom:16px;padding:9px 14px;border-radius:999px;background:${palette.accentSoft};color:${palette.accentSoftText};font-family:${DEFAULT_TEXT};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(definition.category)}</span>
                <h1 style="margin:0 0 18px;font-family:${DEFAULT_TEXT};font-size:34px;line-height:1.08;color:${palette.heading};">${escapeHtml(definition.title)}</h1>
                ${renderParagraphs(definition.paragraphs, palette.body)}
                <div style="padding-top:6px;">
                  ${renderButton(definition.cta, palette.accent, palette.accentText)}
                  ${secondaryButton}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <img src="${escapeHtml(absoluteUrl(definition.heroImage))}" alt="${escapeHtml(definition.heroAlt)}" width="576" style="display:block;width:100%;max-width:576px;height:auto;border-radius:24px;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 6px;">
                ${renderChips(definition.chips, palette)}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
                  ${renderSpotlights(definition.spotlights, palette)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-radius:24px;background:${palette.accentSoft};">
                  <tr>
                    <td style="padding:22px 24px;">
                      <p style="margin:0 0 8px;font-family:${DEFAULT_TEXT};font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${palette.accentSoftText};">Como usar este template</p>
                      <p style="margin:0;font-family:${DEFAULT_TEXT};font-size:15px;line-height:1.7;color:${palette.body};">${escapeHtml(definition.idealFor)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;background:${palette.footer};">
                <p style="margin:0 0 10px;font-family:${DEFAULT_TEXT};font-size:14px;font-weight:700;color:${palette.footerText};">${escapeHtml(siteConfig.brandName)}</p>
                <p style="margin:0 0 14px;font-family:${DEFAULT_TEXT};font-size:14px;line-height:1.7;color:${palette.footerText};">${escapeHtml(definition.footerNote)}</p>
                <p style="margin:0 0 10px;font-family:${DEFAULT_TEXT};font-size:13px;line-height:1.7;color:${palette.footerText};">
                  <a href="${HOME_URL}" target="_blank" rel="noreferrer" style="color:${palette.footerText};text-decoration:underline;">Site</a>
                  &nbsp;|&nbsp;
                  <a href="${siteConfig.socialLinks.instagram}" target="_blank" rel="noreferrer" style="color:${palette.footerText};text-decoration:underline;">Instagram</a>
                  &nbsp;|&nbsp;
                  <a href="mailto:${siteConfig.email}" style="color:${palette.footerText};text-decoration:underline;">${siteConfig.email}</a>
                </p>
                <p style="margin:0;font-family:${DEFAULT_TEXT};font-size:12px;line-height:1.7;color:${palette.footerText};">
                  Se preferir nao receber novas mensagens, <a href="{{unsubscribe_url}}" style="color:${palette.footerText};text-decoration:underline;">clique aqui para descadastrar</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const buildText = (definition: EmailPresetDefinition) => {
  const lines = [
    definition.title,
    '',
    ...definition.paragraphs,
    '',
    `Principal: ${definition.cta.label} - ${definition.cta.url}`,
    definition.secondaryCta ? `Opcao extra: ${definition.secondaryCta.label} - ${definition.secondaryCta.url}` : '',
    '',
    ...definition.spotlights.flatMap((spotlight) => [`${spotlight.label}: ${spotlight.title}`, spotlight.description, spotlight.image, '']),
    'Como usar este template:',
    definition.idealFor,
    '',
    `${siteConfig.brandName}`,
    definition.footerNote,
    `Instagram: ${siteConfig.socialLinks.instagram}`,
    `Contato: ${siteConfig.email}`,
    'Reply-To sugerido: {{reply_to}}',
    'Descadastrar: {{unsubscribe_url}}',
  ].filter(Boolean);

  return lines.join('\n');
};

const createPreset = (definition: EmailPresetDefinition): EmailTemplatePreset => ({
  id: definition.id,
  name: definition.name,
  category: definition.category,
  summary: definition.summary,
  idealFor: definition.idealFor,
  subject: definition.subject,
  preheader: definition.preheader,
  html: buildHtml(definition),
  text: buildText(definition),
  palettePreview: definition.palettePreview,
  tags: definition.chips,
});

const createStaticPreset = (preset: EmailTemplatePreset): EmailTemplatePreset => preset;

export const emailTemplatePresets: EmailTemplatePreset[] = [
  createStaticPreset({
    id: 'prorefeicao-leonardo-comercial',
    name: 'ProRefeicao | Leonardo comercial',
    category: 'Comercial',
    summary:
      'Template comercial do ProRefeicao com CTA direto para o Leonardo, hero forte e blocos objetivos para apresentar operacao, PAT e variedade.',
    idealFor:
      'Bom para prospeccao, follow-up comercial e apresentacao do ProRefeicao para empresas, clinicas, obras e operacoes recorrentes.',
    subject: 'ProRefeicao Villa Cuiabar - Refeicoes Corporativas de Qualidade',
    preheader: 'Refeicoes corporativas com padrao Villa Cuiabar, PAT, flexibilidade e entrega recorrente.',
    html: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>ProRefeicao Villa Cuiabar - Refeicoes Corporativas de Qualidade</title>
  </head>
  <body style="margin:0;padding:0;background:#e8edf4;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#e8edf4;">
      Refeicoes corporativas com padrao Villa Cuiabar, PAT, flexibilidade e entrega recorrente.&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#e8edf4;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#f8fbff;border-radius:32px;overflow:hidden;box-shadow:0 10px 30px rgba(22,35,55,0.08);">
            <tr>
              <td style="padding:26px 32px;background:#162337;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <a href="https://cuiabar.com/prorefeicao" target="_blank" rel="noreferrer" style="text-decoration:none;">
                        <img src="https://cuiabar.com/prorefeicao/logo-prorefeicao.png" alt="ProRefeicao" width="164" style="display:block;width:164px;max-width:100%;height:auto;border:0;" />
                      </a>
                    </td>
                    <td align="right">
                      <p style="margin:0 0 8px;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#d7e4f5;">ProRefeicao</p>
                      <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:11px;line-height:1.5;color:#d7e4f5;">Campanha: {{campaign_name}}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 20px;">
                <span style="display:inline-block;margin-bottom:16px;padding:9px 18px;border-radius:999px;background:#dfeaf6;color:#31597d;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">B2B • Refeicoes Recorrentes</span>
                <h1 style="margin:0 0 20px;font-family:Arial, Helvetica, sans-serif;font-size:32px;line-height:1.1;color:#1f3247;">
                  Refeicoes corporativas com <span style="color:#2d6ea2;">padrao Villa Cuiabar</span> para sua equipe
                </h1>
                <p style="margin:0 0 24px;font-family:Arial, Helvetica, sans-serif;font-size:17px;line-height:1.65;color:#425a71;">
                  Qualidade, pontualidade, variedade e organizacao para empresas, clinicas, obras e casas de repouso.
                </p>
                <a href="https://wa.me/551933058878?text=Ol%C3%A1%2C%20quero%20conversar%20sobre%20ProRefei%C3%A7%C3%A3o%20para%20minha%20empresa." target="_blank" rel="noreferrer" style="display:inline-block;padding:16px 32px;border-radius:999px;background:#2d6ea2;color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;font-weight:700;text-decoration:none;">
                  Falar com Leonardo (Gerente Comercial)
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <img src="https://cuiabar.com/prorefeicao/marmita-parmegiana.png" alt="Marmitex de parmegiana do ProRefeicao" width="576" style="display:block;width:100%;max-width:576px;height:auto;border-radius:24px;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
                  <tr>
                    <td style="padding:0 0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9e3ef;border-radius:24px;background:#f8fbff;">
                        <tr>
                          <td style="padding:28px 24px;">
                            <span style="display:inline-block;margin-bottom:12px;padding:8px 16px;border-radius:999px;background:#dfeaf6;color:#31597d;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Nossa Historia</span>
                            <h3 style="margin:0 0 14px;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:1.2;color:#1f3247;">Mais de 8 anos de excelencia em gastronomia</h3>
                            <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;line-height:1.7;color:#425a71;">
                              Desde 2017 atuamos com gastronomia de alto padrao. Ha 5 anos nos especializamos em refeicoes prontas de grande volume para empresas, escritorios, obras, clinicas e casas de repouso.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9e3ef;border-radius:24px;background:#f8fbff;">
                        <tr>
                          <td style="padding:28px 24px;">
                            <span style="display:inline-block;margin-bottom:12px;padding:8px 16px;border-radius:999px;background:#dfeaf6;color:#31597d;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Nossa Missao</span>
                            <h3 style="margin:0 0 12px;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:1.2;color:#1f3247;">Organizar e elevar a alimentacao da sua equipe</h3>
                            <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;line-height:1.7;color:#425a71;">
                              <strong>Nosso objetivo:</strong> entregar refeicoes de qualidade premium com previsibilidade total, para que voce foque no crescimento do seu negocio.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9e3ef;border-radius:24px;background:#f8fbff;">
                        <tr>
                          <td style="padding:24px;">
                            <span style="display:inline-block;margin-bottom:16px;padding:8px 16px;border-radius:999px;background:#dfeaf6;color:#31597d;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Variedade de Cardapios</span>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding:0 8px 16px 0;width:50%;">
                                  <img src="https://cuiabar.com/prorefeicao/marmita-carne.png" alt="Marmitex premium com carne e acompanhamentos" width="300" style="display:block;width:100%;max-width:300px;height:auto;border-radius:16px;border:0;" />
                                </td>
                                <td style="padding:0 0 16px 8px;width:50%;">
                                  <img src="https://cuiabar.com/prorefeicao/marmita-mix.png" alt="Mix de marmitex corporativos do ProRefeicao" width="300" style="display:block;width:100%;max-width:300px;height:auto;border-radius:16px;border:0;" />
                                </td>
                              </tr>
                            </table>
                            <p style="margin:12px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;line-height:1.7;color:#425a71;">
                              Cardapios rotativos com opcoes tradicionais, fitness, vegetarianas e especiais. Todas as marmitas sao montadas com ingredientes frescos e embalagem individual selada.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9e3ef;border-radius:24px;background:#f8fbff;">
                        <tr>
                          <td style="padding:28px 24px;">
                            <span style="display:inline-block;margin-bottom:12px;padding:8px 16px;border-radius:999px;background:#dfeaf6;color:#31597d;font-family:Arial, Helvetica, sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Atendimento &amp; PAT</span>
                            <h3 style="margin:0 0 12px;font-family:Arial, Helvetica, sans-serif;font-size:22px;line-height:1.2;color:#1f3247;">Campinas, regiao metropolitana e entorno</h3>
                            <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;line-height:1.7;color:#425a71;">
                              Entregas flexiveis, horarios personalizados, precos competitivos e condicoes facilitadas de pagamento via boleto, PIX ou faturamento mensal.
                            </p>
                            <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:15.5px;line-height:1.7;color:#425a71;">
                              <strong>Programa PAT:</strong> reduza impostos, melhore o bem-estar da equipe, diminua o turnover e mantenha sua empresa organizada e em conformidade.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#2d6ea2;border-radius:24px;">
                  <tr>
                    <td style="padding:36px 28px;text-align:center;">
                      <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:18px;line-height:1.45;color:#ffffff;">
                        Estamos prontos para entender sua necessidade e criar a melhor solucao de alimentacao corporativa com qualidade e organizacao.
                      </p>
                      <a href="https://wa.me/551933058878?text=Ol%C3%A1%20Leonardo%2C%20quero%20conversar%20sobre%20ProRefei%C3%A7%C3%A3o%20para%20minha%20empresa." target="_blank" rel="noreferrer" style="display:inline-block;padding:17px 38px;border-radius:999px;background:#ffffff;color:#2d6ea2;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;text-decoration:none;">
                        Falar agora com Leonardo (Gerente Comercial)
                      </a>
                      <p style="margin:18px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:14px;color:#c5e0ff;">leonardo@cuiabar.net</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;background:#17293d;color:#dbe8f7;">
                <p style="margin:0 0 12px;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:700;">Villa Cuiabar | ProRefeicao • Campinas/SP</p>
                <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:13.5px;line-height:1.65;">
                  Qualidade desde 2017. Refeicoes corporativas com padrao elevado e total previsibilidade.
                </p>
                <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:1.6;">
                  <a href="https://cuiabar.com/prorefeicao" style="color:#dbe8f7;text-decoration:underline;">Conheca o ProRefeicao</a>
                  •
                  <a href="https://instagram.com/cuiabar" style="color:#dbe8f7;text-decoration:underline;">Instagram</a>
                </p>
                <p style="margin:16px 0 0;font-size:12px;color:#8fa6c2;">
                  Para descadastrar: <a href="{{unsubscribe_url}}" style="color:#8fa6c2;text-decoration:underline;">clique aqui</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `ProRefeicao Villa Cuiabar - Refeicoes Corporativas de Qualidade

Refeicoes corporativas com padrao Villa Cuiabar para sua equipe.

Qualidade, pontualidade, variedade e organizacao para empresas, clinicas, obras e casas de repouso.

Falar com Leonardo (Gerente Comercial):
https://wa.me/551933058878?text=Ol%C3%A1%2C%20quero%20conversar%20sobre%20ProRefei%C3%A7%C3%A3o%20para%20minha%20empresa.

Nossa Historia:
Mais de 8 anos de excelencia em gastronomia. Desde 2017 atuamos com gastronomia de alto padrao. Ha 5 anos nos especializamos em refeicoes prontas de grande volume para empresas, escritorios, obras, clinicas e casas de repouso.

Nossa Missao:
Organizar e elevar a alimentacao da sua equipe. Nosso objetivo e entregar refeicoes de qualidade premium com previsibilidade total, para que voce foque no crescimento do seu negocio.

Variedade de Cardapios:
Cardapios rotativos com opcoes tradicionais, fitness, vegetarianas e especiais. Todas as marmitas sao montadas com ingredientes frescos e embalagem individual selada.

Atendimento e PAT:
Campinas, regiao metropolitana e entorno. Entregas flexiveis, horarios personalizados, precos competitivos e condicoes facilitadas de pagamento via boleto, PIX ou faturamento mensal.

Programa PAT:
Reduza impostos, melhore o bem-estar da equipe, diminua o turnover e mantenha sua empresa organizada e em conformidade.

Contato:
leonardo@cuiabar.net
https://cuiabar.com/prorefeicao
https://instagram.com/cuiabar

Campanha: {{campaign_name}}
Reply-To sugerido: {{reply_to}}
Descadastrar: {{unsubscribe_url}}`,
    palettePreview: ['#162337', '#2d6ea2', '#dfeaf6'],
    tags: ['ProRefeicao', 'Leonardo', 'PAT', 'B2B'],
  }),
  createPreset({
    id: 'editorial-villa',
    name: 'Editorial Villa Cuiabar',
    category: 'Newsletter',
    summary: 'Template de relacionamento com visual editorial para manter a base aquecida e levar trafego para site, reservas e pedidos.',
    idealFor: 'Bom ponto de partida para newsletters gerais, campanhas com varios links e mensagens de relacionamento com base ativa.',
    subject: 'Novidades do Villa Cuiabar para abrir a sua semana',
    preheader: 'Pratos em destaque, links rapidos e uma mensagem com cara de marca.',
    eyebrow: 'Villa Cuiabar',
    title: 'Uma semana boa comeca com sabor, clima e um motivo para voltar.',
    paragraphs: [
      'Ola {{first_name}}, separamos uma mensagem com cara de Villa Cuiabar para manter sua base aquecida sem virar vitrine genrica.',
      'Use este layout para combinar pratos bem servidos, links rapidos de pedido e uma chamada elegante para reservas, novidades ou campanhas sazonais.',
      'O foco aqui e gerar clique com leitura leve, visual limpo e uma hierarquia que funciona bem tanto para relacionamento quanto para conversao.',
    ],
    cta: {
      label: 'Abrir site do Villa Cuiabar',
      url: HOME_URL,
    },
    secondaryCta: {
      label: 'Reservar pelo WhatsApp',
      url: RESERVATION_URL,
    },
    heroImage: '/menu/bife-chorizo.png',
    heroAlt: 'Prato do Villa Cuiabar em destaque',
    chips: ['Relacionamento', 'Reservas', 'Site oficial'],
    spotlights: [
      {
        label: 'Prato em destaque',
        title: 'Leve o cardapio completo para o clique certo.',
        description: 'Ideal para campanhas que precisam apontar o proximo passo com clareza, seja menu, reservas ou pedidos diretos.',
        image: '/menu/picanha-carreteira.png',
        alt: 'Prato com picanha carreteira',
      },
      {
        label: 'Movimento da semana',
        title: 'Misture conteudo, oferta e servico sem perder identidade.',
        description: 'A estrutura segura blocos editoriais, destaques de produto e recados de operacao em um unico envio.',
        image: '/menu/linguica-cuiabana.png',
        alt: 'Prato de linguica cuiabana',
      },
    ],
    footerNote: 'Use este template quando a ideia for lembrar a base de que o Villa Cuiabar continua presente, relevante e facil de acessar.',
    palette: {
      page: '#efe5d8',
      surface: '#fffaf4',
      hero: '#3f2416',
      heroText: '#f6dfc6',
      accent: '#b45b30',
      accentText: '#ffffff',
      accentSoft: '#f3e1cf',
      accentSoftText: '#7b3d20',
      heading: '#2f1c12',
      body: '#5c4738',
      muted: '#866753',
      border: '#ead6c2',
      footer: '#3a2317',
      footerText: '#f3e4d5',
    },
    palettePreview: ['#3f2416', '#b45b30', '#f3e1cf'],
  }),
  createPreset({
    id: 'cardapio-da-semana',
    name: 'Cardapio da semana',
    category: 'Cardapio',
    summary: 'Template para puxar almoco, jantar e pratos em destaque com CTA forte para menu e pedido direto.',
    idealFor: 'Use quando a campanha precisa vender o cardapio da semana, os pratos do dia ou um almoco com mais intencao comercial.',
    subject: 'Seu proximo almoco no Cuiabar pode comecar aqui',
    preheader: 'Um email pensado para levar a base do interesse ao pedido sem excesso de ruidao.',
    eyebrow: 'Cardapio em destaque',
    title: 'Pratos que seguram a fome e deixam vontade de repetir.',
    paragraphs: [
      'Ola {{first_name}}, este preset foi pensado para campanhas mais comerciais, com foco em cardapio, fome imediata e decisao rapida.',
      'A composicao prioriza hero forte, duas vitrines de destaque e CTA principal para menu ou pedido direto, sem perder a assinatura do Villa Cuiabar.',
      'Tambem funciona bem para disparos de almoco, jantar, pratos executivos e listas mais quentes.',
    ],
    cta: {
      label: 'Ver cardapio completo',
      url: MENU_URL,
    },
    secondaryCta: {
      label: 'Pedir no site oficial',
      url: siteConfig.orderLinks.direct,
    },
    heroImage: '/menu/file-mignon.png',
    heroAlt: 'Prato executivo do Villa Cuiabar',
    chips: ['Almoco', 'Jantar', 'Pedido direto'],
    spotlights: [
      {
        label: 'Destaque do dia',
        title: 'Monte campanhas com prato protagonista sem parecer panfleto.',
        description: 'Use a primeira vitrine para o carro-chefe do envio e a segunda para reforco de variedade ou ticket medio.',
        image: '/menu/risoto-de-costela.png',
        alt: 'Risoto de costela do Villa Cuiabar',
      },
      {
        label: 'Fechamento comercial',
        title: 'Empurre o clique para menu ou pedido com menos friccao.',
        description: 'O rodape conversa com relacionamento, mas a leitura inteira foi desenhada para converter melhor em trafego qualificado.',
        image: '/menu/parmignon.png',
        alt: 'Parmegiana do Villa Cuiabar',
      },
    ],
    footerNote: 'Ajuste assunto, imagens e CTA conforme o prato protagonista da semana e mantenha o texto simples para acelerar a decisao.',
    palette: {
      page: '#f2ebdf',
      surface: '#fffdf9',
      hero: '#5b311d',
      heroText: '#f6e6d7',
      accent: '#c06a2f',
      accentText: '#ffffff',
      accentSoft: '#f4dfc5',
      accentSoftText: '#8c511f',
      heading: '#341e12',
      body: '#5e4837',
      muted: '#8a6b55',
      border: '#eadcc9',
      footer: '#402315',
      footerText: '#f8e8db',
    },
    palettePreview: ['#5b311d', '#c06a2f', '#f4dfc5'],
  }),
  createPreset({
    id: 'burger-n-smoke',
    name: "Burger N' Smoke delivery",
    category: 'Delivery',
    summary: 'Layout mais vibrante para combos, burgers, fritas e campanhas de pedido rapido da nova marca.',
    idealFor: 'Funciona melhor em campanhas de entrega, combos, promocao de burger e trafego para o site da marca ou WhatsApp.',
    subject: "Burger N' Smoke com visual forte para combos e pedidos rapidos",
    preheader: 'Burger, frita e bebida em um template pronto para canais de pedido.',
    eyebrow: "Burger N' Smoke",
    title: 'Pedido rapido, visual quente e CTA pronto para converter.',
    paragraphs: [
      "Ola {{first_name}}, este preset usa a linguagem do Burger N' Smoke com mais contraste, energia visual e CTA direto para entrega.",
      'Ele foi desenhado para mensagens de fome imediata: combos, burgers, acompanhamentos e campanhas que precisam de clique rapido.',
      'Use o botao principal para levar ao site da marca e o segundo para abrir uma rota complementar como Instagram ou WhatsApp.',
    ],
    cta: {
      label: 'Abrir site da marca',
      url: siteConfig.burgerNSmokeOrderLinks.direct,
    },
    secondaryCta: {
      label: 'Abrir Instagram',
      url: siteConfig.burgerNSmokeOrderLinks.instagram,
    },
    heroImage: '/burger-n-smoke/menu/hero-burger.jpg',
    heroAlt: "Burger do Burger N' Smoke em destaque",
    chips: ['Burger', 'Combo', 'Delivery'],
    spotlights: [
      {
        label: 'Hero de venda',
        title: 'Use um burger principal para abrir desejo logo no topo.',
        description: 'A imagem grande traz impacto e ajuda a mensagem a funcionar melhor em listas acostumadas com oferta e rapidez.',
        image: '/burger-n-smoke/menu/o-bruto.webp',
        alt: "Burger O Bruto do Burger N' Smoke",
      },
      {
        label: 'Canal da marca',
        title: 'Direcione o clique para o pedido que voce quer priorizar.',
        description: 'O bloco final ajuda a organizar site, Instagram e contato com menos ruido na leitura.',
        image: '/burger-n-smoke/menu/o-colosso.webp',
        alt: "Burger O Colosso do Burger N' Smoke",
      },
    ],
    footerNote: 'A regra aqui e simples: menos texto, mais desejo visual e CTA sem desvio para levar a base da vontade ao pedido.',
    palette: {
      page: '#fde6c3',
      surface: '#fff7e8',
      hero: '#2e0501',
      heroText: '#ffd8af',
      accent: '#c95f1d',
      accentText: '#fff9f1',
      accentSoft: '#ffe5bf',
      accentSoftText: '#7f3404',
      heading: '#2e0501',
      body: '#6b4634',
      muted: '#94604a',
      border: '#efcda5',
      footer: '#3a1108',
      footerText: '#ffe7c7',
    },
    palettePreview: ['#2e0501', '#c95f1d', '#ffe5bf'],
  }),
  createPreset({
    id: 'prorefeicao-b2b',
    name: 'ProRefeicao corporativo',
    category: 'B2B',
    summary: 'Template institucional-comercial para apresentar o ProRefeicao a empresas, operacoes e times de compras.',
    idealFor: 'Melhor escolha para apresentacoes comerciais, listas frias ou mornas e campanhas focadas em operacoes recorrentes.',
    subject: 'ProRefeicao Villa Cuiabar para empresas e operacoes recorrentes',
    preheader: 'Apresente volume, padrao e canal comercial direto com um layout mais institucional.',
    eyebrow: 'ProRefeicao',
    title: 'Uma apresentacao mais institucional para quem compra refeicao recorrente.',
    paragraphs: [
      'Ola {{first_name}}, este template posiciona o ProRefeicao com mais densidade institucional, sem ficar frio ou burocratico demais.',
      'A estrutura combina hero corporativo, beneficios operacionais e CTA direto para o comercial, servindo bem para empresas, clinicas, obras e operacoes recorrentes.',
      'Se a meta for abrir conversa, pedir reuniao ou apresentar escopo, este preset economiza bastante trabalho de diagramacao.',
    ],
    cta: {
      label: 'Falar com o comercial',
      url: COMMERCIAL_URL,
    },
    secondaryCta: {
      label: 'Conhecer ProRefeicao',
      url: PROREFEICAO_URL,
    },
    heroImage: '/prorefeicao/marmita-parmegiana.png',
    heroAlt: 'Marmitex de parmegiana do ProRefeicao',
    chips: ['B2B', 'Operacao continua', 'WhatsApp comercial'],
    spotlights: [
      {
        label: 'Operacao',
        title: 'Mostre consistencia, volume e rotina com uma linguagem mais segura.',
        description: 'O primeiro bloco ajuda a apresentar estrutura operacional, previsibilidade de atendimento e padrao de entrega.',
        image: '/prorefeicao/marmita-carne.png',
        alt: 'Marmitex corporativo com carne e acompanhamentos',
      },
      {
        label: 'Apresentacao',
        title: 'Defenda qualidade e integridade sem exagero de promessa.',
        description: 'O segundo bloco serve para falar de embalagem selada, montagem padronizada e canal comercial direto.',
        image: '/prorefeicao/marmita-mix.png',
        alt: 'Mix de marmitex corporativos do ProRefeicao',
      },
    ],
    footerNote: 'Use este template para abrir conversas comerciais com mais clareza sobre proposta, escala e proximo passo.',
    palette: {
      page: '#e8edf4',
      surface: '#f8fbff',
      hero: '#162337',
      heroText: '#d7e4f5',
      accent: '#2d6ea2',
      accentText: '#ffffff',
      accentSoft: '#dfeaf6',
      accentSoftText: '#31597d',
      heading: '#1f3247',
      body: '#425a71',
      muted: '#667f97',
      border: '#d9e3ef',
      footer: '#17293d',
      footerText: '#dbe8f7',
    },
    palettePreview: ['#162337', '#2d6ea2', '#dfeaf6'],
  }),
];

export const defaultEmailTemplatePreset = emailTemplatePresets[0];
