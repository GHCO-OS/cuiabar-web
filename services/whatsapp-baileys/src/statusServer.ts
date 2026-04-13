import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Logger } from 'pino';
import type { BridgeStatus } from './types.js';

export const startStatusServer = (params: {
  host: string;
  port: number;
  logger: Logger;
  getStatus: () => BridgeStatus;
}) => {
  const server = http.createServer((request, response) => {
    if (!request.url || request.url === '/' || request.url === '/health' || request.url === '/status') {
      const payload = JSON.stringify({
        ok: true,
        status: params.getStatus(),
      });
      response.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(payload);
      return;
    }

    response.writeHead(404, {
      'content-type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ ok: false, error: 'Not found' }));
  });

  server.listen(params.port, params.host, () => {
    const address = server.address() as AddressInfo | null;
    params.logger.info(
      {
        host: params.host,
        port: address?.port ?? params.port,
      },
      'Servidor local de status do Baileys pronto.',
    );
  });

  return server;
};
