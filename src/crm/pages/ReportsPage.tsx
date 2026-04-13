import { useEffect, useState } from 'react';
import { downloadUrl } from '../api';
import { Badge, PageHeader, Panel } from '../components';
import { useCrm } from '../context';
import { campaignStatusLabels, label } from '../labels';
import type { Campaign } from '../types';
import { crmRequest } from '../api';

export const ReportsPage = () => {
  const { csrfToken } = useCrm();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    crmRequest<{ ok: true; campaigns: Campaign[] }>('/api/campaigns', {}, csrfToken)
      .then((response) => setCampaigns(response.campaigns))
      .catch(() => setCampaigns([]));
  }, [csrfToken]);

  return (
    <div className="space-y-6">
      <PageHeader title="Relatorios" description="Exportacoes CSV para contatos, campanhas, cliques, descadastros e falhas. Open tracking permanece opcional e imperfeito." />
      <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
        <Panel className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Exportar dados</h2>
          <div className="grid gap-3">
            {['contacts.csv', 'campaigns.csv', 'clicks.csv', 'unsubscribes.csv', 'failures.csv'].map((file) => (
              <a key={file} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10" href={downloadUrl(`/api/exports/${file}`)}>
                Baixar {file}
              </a>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">Campanhas recentes</h2>
          <div className="mt-4 space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{campaign.name}</p>
                    <p className="text-sm text-slate-400">{campaign.subject}</p>
                  </div>
                  <Badge tone={campaign.status === 'sent' ? 'success' : campaign.status === 'failed' ? 'danger' : 'warning'}>{label(campaignStatusLabels, campaign.status)}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
                  <span>Destinatarios: {campaign.totalRecipients}</span>
                  <span>Enviados: {campaign.totalSent}</span>
                  <span>Falhas: {campaign.totalFailed}</span>
                  <span>Cliques unicos: {campaign.totalUniqueClicks}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
