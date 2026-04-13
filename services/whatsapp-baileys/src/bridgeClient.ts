import type {
  BridgeControlRequest,
  BridgeHeartbeatPayload,
  InboundProcessResponse,
  NormalizedInboundMessage,
  PullOutboundResponse,
  PulledOutboundCommand,
} from './types.js';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class BridgeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  async postInbound(message: NormalizedInboundMessage) {
    return this.request<InboundProcessResponse>('/api/internal/whatsapp/inbound', {
      method: 'POST',
      body: {
        message,
      },
    });
  }

  async pullOutbound(limit: number): Promise<PulledOutboundCommand[]> {
    const response = await this.request<PullOutboundResponse>(`/api/internal/whatsapp/outbound/pull?limit=${limit}`, {
      method: 'GET',
    });
    return response.commands ?? [];
  }

  async acknowledgeOutbound(commandId: string, providerMessageId: string | null, payload?: Record<string, JsonValue>) {
    await this.request(`/api/internal/whatsapp/outbound/${commandId}/ack`, {
      method: 'POST',
      body: {
        providerMessageId,
        payload,
      },
    });
  }

  async failOutbound(commandId: string, errorMessage: string, payload?: Record<string, JsonValue>) {
    await this.request(`/api/internal/whatsapp/outbound/${commandId}/fail`, {
      method: 'POST',
      body: {
        errorMessage,
        payload,
      },
    });
  }

  async postStatus(providerMessageId: string, status: string, payload?: Record<string, JsonValue>) {
    await this.request('/api/internal/whatsapp/status', {
      method: 'POST',
      body: {
        status: {
          providerMessageId,
          status,
          timestamp: new Date().toISOString(),
          rawPayload: payload ?? {},
        },
      },
    });
  }

  async pushHeartbeat(status: BridgeHeartbeatPayload) {
    await this.request('/api/internal/whatsapp/bridge/heartbeat', {
      method: 'POST',
      body: {
        status,
      },
    });
  }

  async pullBridgeControl(): Promise<BridgeControlRequest | null> {
    const response = await this.request<{ ok: boolean; request: BridgeControlRequest | null }>('/api/internal/whatsapp/bridge/control', {
      method: 'GET',
    });
    return response.request ?? null;
  }

  async acknowledgeBridgeControl(
    requestId: string,
    status: 'completed' | 'failed' | 'ignored',
    resultMessage?: string | null,
  ) {
    await this.request(`/api/internal/whatsapp/bridge/control/${requestId}/ack`, {
      method: 'POST',
      body: {
        status,
        resultMessage,
      },
    });
  }

  private async request<T = { ok: boolean }>(
    endpoint: string,
    init: {
      method: 'GET' | 'POST';
      body?: unknown;
    },
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: init.method,
      headers: {
        'content-type': 'application/json',
        'x-internal-token': this.internalToken,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bridge request falhou (${response.status}): ${errorText.slice(0, 400)}`);
    }

    return (await response.json()) as T;
  }
}
