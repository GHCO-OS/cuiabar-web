const directusUrl = (process.env.DIRECTUS_URL || 'http://localhost:8055').trim().replace(/\/$/, '');
const adminEmail = (process.env.DIRECTUS_ADMIN_EMAIL || 'admin@cuiabar.com').trim();
const adminPassword = (process.env.DIRECTUS_ADMIN_PASSWORD || 'AdminCuiabar2026!').trim();
const collection = (process.env.DIRECTUS_BLOG_COLLECTION || 'blog_posts').trim();

const fieldBlueprint = [
  {
    field: 'title',
    type: 'string',
    meta: { interface: 'input', required: true, width: 'full' },
    schema: { is_nullable: false },
  },
  {
    field: 'slug',
    type: 'string',
    meta: { interface: 'input', required: true, width: 'half' },
    schema: { is_nullable: false, is_unique: true },
  },
  {
    field: 'status',
    type: 'string',
    meta: { interface: 'select-dropdown', options: { choices: [{ text: 'draft', value: 'draft' }, { text: 'published', value: 'published' }] }, width: 'half' },
    schema: { is_nullable: false, default_value: 'draft' },
  },
  {
    field: 'category',
    type: 'string',
    meta: { interface: 'input', width: 'half' },
  },
  {
    field: 'eyebrow',
    type: 'string',
    meta: { interface: 'input', width: 'half' },
  },
  {
    field: 'read_time',
    type: 'string',
    meta: { interface: 'input', width: 'half' },
  },
  {
    field: 'publish_date',
    type: 'timestamp',
    meta: { interface: 'datetime', width: 'half' },
  },
  {
    field: 'excerpt',
    type: 'text',
    meta: { interface: 'input-multiline', required: true, width: 'full' },
    schema: { is_nullable: false },
  },
  {
    field: 'summary',
    type: 'text',
    meta: { interface: 'input-multiline', required: true, width: 'full' },
    schema: { is_nullable: false },
  },
  {
    field: 'keywords',
    type: 'json',
    meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' },
  },
  {
    field: 'sections',
    type: 'json',
    meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' },
  },
  {
    field: 'cover_image_external_url',
    type: 'string',
    meta: { interface: 'input', width: 'full' },
  },
];

const request = async (path, { method = 'GET', token = '', body } = {}) => {
  const response = await fetch(`${directusUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${method} ${path} falhou (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const ensureCollection = async (token) => {
  const existing = await request(`/collections/${collection}`, { token }).catch(() => null);
  if (existing?.data?.collection === collection) {
    return;
  }

  await request('/collections', {
    method: 'POST',
    token,
    body: {
      collection,
      meta: {
        icon: 'article',
        note: 'Conteudo editorial da Cuiabar',
        hidden: false,
        singleton: false,
      },
      schema: {
        name: collection,
      },
    },
  });
};

const ensureFields = async (token) => {
  const fieldsResponse = await request(`/fields/${collection}`, { token });
  const existingFields = new Set((fieldsResponse?.data || []).map((field) => field.field));

  for (const field of fieldBlueprint) {
    if (existingFields.has(field.field)) {
      continue;
    }

    await request(`/fields/${collection}`, {
      method: 'POST',
      token,
      body: field,
    });
  }
};

const ensureSeedPost = async (token) => {
  const items = await request(`/items/${collection}?limit=1`, { token });
  if (Array.isArray(items?.data) && items.data.length > 0) {
    return;
  }

  await request(`/items/${collection}`, {
    method: 'POST',
    token,
    body: {
      title: 'Onde comer no Jardim Aurelia: guia rapido da Cuiabar',
      slug: 'onde-comer-no-jardim-aurelia',
      status: 'published',
      category: 'Guia local',
      eyebrow: 'Editorial',
      read_time: '5 min',
      publish_date: new Date().toISOString(),
      excerpt: 'Guia editorial de estreia para validar o fluxo completo do painel para o blog.',
      summary: 'Post inicial de validacao da operacao editorial via Directus com foco em publicacao e sincronizacao.',
      keywords: ['blog cuiabar', 'campinas', 'jardim aurelia'],
      cover_image_external_url: 'https://blog.cuiabar.com/home/home-salao-dia-da-mulher.jpg',
      sections: [
        {
          title: 'Contexto',
          body: 'Este post inaugura o fluxo de edicao no painel.',
          sort: 1,
        },
        {
          title: 'Objetivo',
          body: 'Validar criacao, publicacao e sincronizacao com o frontend.',
          sort: 2,
        },
      ],
    },
  });
};

const main = async () => {
  const login = await request('/auth/login', {
    method: 'POST',
    body: {
      email: adminEmail,
      password: adminPassword,
    },
  });

  const token = String(login?.data?.access_token || '').trim();
  if (!token) {
    throw new Error('Nao foi possivel obter token de acesso do Directus.');
  }

  await ensureCollection(token);
  await ensureFields(token);
  await ensureSeedPost(token);
  console.log(`[bootstrap-directus] Colecao "${collection}" pronta com seed inicial.`);
};

main().catch((error) => {
  console.error('[bootstrap-directus] erro:', error.message);
  process.exit(1);
});
