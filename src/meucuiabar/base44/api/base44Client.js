import ChecklistSeed from '@meucuiabar/seed/Checklist.json';
import ChecklistResponseSeed from '@meucuiabar/seed/ChecklistResponse.json';
import CleaningPlanSeed from '@meucuiabar/seed/CleaningPlan.json';
import CleaningRecordSeed from '@meucuiabar/seed/CleaningRecord.json';
import EquipmentSeed from '@meucuiabar/seed/Equipment.json';
import EquipmentTypeConfigSeed from '@meucuiabar/seed/EquipmentTypeConfig.json';
import EtapasProcessoSeed from '@meucuiabar/seed/EtapasProcesso.json';
import MonitoramentosPCCSeed from '@meucuiabar/seed/MonitoramentosPCC.json';
import NonConformitySeed from '@meucuiabar/seed/NonConformity.json';
import OilChangeSeed from '@meucuiabar/seed/OilChange.json';
import PCCsSeed from '@meucuiabar/seed/PCCs.json';
import PerigosProcessoSeed from '@meucuiabar/seed/PerigosProcesso.json';
import PlanosHACCPSeed from '@meucuiabar/seed/PlanosHACCP.json';
import ProduceWashingSeed from '@meucuiabar/seed/ProduceWashing.json';
import SectorSeed from '@meucuiabar/seed/Sector.json';
import TemperatureRecordSeed from '@meucuiabar/seed/TemperatureRecord.json';
import UnitSeed from '@meucuiabar/seed/Unit.json';
import VerificacoesHACCPSeed from '@meucuiabar/seed/VerificacoesHACCP.json';

const STORAGE_KEY = 'meucuiabar_local_store_v1';

const seedStore = {
  Checklist: ChecklistSeed,
  ChecklistResponse: ChecklistResponseSeed,
  CleaningPlan: CleaningPlanSeed,
  CleaningRecord: CleaningRecordSeed,
  Equipment: EquipmentSeed,
  EquipmentTypeConfig: EquipmentTypeConfigSeed,
  EtapasProcesso: EtapasProcessoSeed,
  MonitoramentosPCC: MonitoramentosPCCSeed,
  NonConformity: NonConformitySeed,
  OilChange: OilChangeSeed,
  PCCs: PCCsSeed,
  PerigosProcesso: PerigosProcessoSeed,
  PlanosHACCP: PlanosHACCPSeed,
  ProduceWashing: ProduceWashingSeed,
  Sector: SectorSeed,
  TemperatureRecord: TemperatureRecordSeed,
  Unit: UnitSeed,
  VerificacoesHACCP: VerificacoesHACCPSeed,
};

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const safeWindow = () => (typeof window !== 'undefined' ? window : null);

const loadStore = () => {
  const currentWindow = safeWindow();
  if (!currentWindow) {
    return clone(seedStore);
  }

  const raw = currentWindow.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = clone(seedStore);
    currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const fallback = clone(seedStore);
    currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

const saveStore = (store) => {
  const currentWindow = safeWindow();
  if (!currentWindow) {
    return;
  }
  currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const generateLocalId = (entityName) => `${entityName.toLowerCase()}_${crypto.randomUUID().replace(/-/g, '')}`;

const compareValues = (left, right) => {
  if (Array.isArray(right) || typeof right === 'object') {
    return JSON.stringify(left ?? null) === JSON.stringify(right);
  }
  return left === right;
};

const matchesFilter = (record, filter) =>
  Object.entries(filter ?? {}).every(([key, value]) => compareValues(record?.[key], value));

const sortRecords = (records, sortKey) => {
  if (!sortKey) {
    return records;
  }

  const descending = sortKey.startsWith('-');
  const field = descending ? sortKey.slice(1) : sortKey;
  return [...records].sort((left, right) => {
    const leftValue = left?.[field] ?? null;
    const rightValue = right?.[field] ?? null;
    if (leftValue === rightValue) {
      return 0;
    }
    if (leftValue == null) {
      return descending ? 1 : -1;
    }
    if (rightValue == null) {
      return descending ? -1 : 1;
    }
    return descending ? String(rightValue).localeCompare(String(leftValue)) : String(leftValue).localeCompare(String(rightValue));
  });
};

const createEntityClient = (entityName) => ({
  async list() {
    const store = loadStore();
    return clone(store[entityName] ?? []);
  },

  async get(id) {
    const store = loadStore();
    const row = (store[entityName] ?? []).find((record) => record.id === id);
    return row ? clone(row) : null;
  },

  async filter(filter = {}, sortKey, limit) {
    const store = loadStore();
    const rows = (store[entityName] ?? []).filter((record) => matchesFilter(record, filter));
    const sorted = sortRecords(rows, sortKey);
    const limited = typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    return clone(limited);
  },

  async create(input) {
    const store = loadStore();
    const now = new Date().toISOString();
    const row = {
      id: generateLocalId(entityName),
      created_date: now,
      updated_date: now,
      ...input,
    };
    store[entityName] = [...(store[entityName] ?? []), row];
    saveStore(store);
    return clone(row);
  },

  async update(id, input) {
    const store = loadStore();
    const rows = store[entityName] ?? [];
    const index = rows.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error(`Registro ${entityName} ${id} nao encontrado.`);
    }

    const updated = {
      ...rows[index],
      ...input,
      updated_date: new Date().toISOString(),
    };
    rows[index] = updated;
    store[entityName] = rows;
    saveStore(store);
    return clone(updated);
  },

  async delete(id) {
    const store = loadStore();
    store[entityName] = (store[entityName] ?? []).filter((record) => record.id !== id);
    saveStore(store);
    return { ok: true };
  },
});

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo local.'));
    reader.readAsDataURL(file);
  });

export const base44 = {
  entities: Object.fromEntries(Object.keys(seedStore).map((entityName) => [entityName, createEntityClient(entityName)])),
  integrations: {
    Core: {
      async UploadFile({ file }) {
        if (!file) {
          throw new Error('Arquivo ausente.');
        }
        const fileUrl = await readFileAsDataUrl(file);
        return { file_url: fileUrl };
      },
    },
  },
  auth: {
    async me() {
      return null;
    },
    logout() {},
    redirectToLogin() {},
  },
};
