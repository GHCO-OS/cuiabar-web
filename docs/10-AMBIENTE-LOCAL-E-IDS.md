# Ambiente local e IDs operacionais

Atualizado em: 2026-04-13 14:46 BRT

## Objetivo

Este documento registra os identificadores operacionais deste computador e do bridge local do WhatsApp para facilitar suporte, retomada do projeto em outra instancia e auditoria basica.

Importante:

- este arquivo nao guarda segredos
- tokens, cookies e credenciais continuam fora do versionamento
- o QR do WhatsApp nao deve ser copiado para documentacao

## Repositorio

- Repositorio GitHub alvo: `https://github.com/GHCO-OS/cuiabar-web`
- Organizacao/owner: `cuiabar`
- Nome: `cuiabar-web`
- Visibilidade: privada
- Branch principal local: `main`
- Workspace local principal: `C:\workspace\cuiabar-web`
- Backup/snapshot anterior: `G:\Meu Drive\cuiabar-web`

## Identidade desta maquina

- `COMPUTERNAME`: `CUIABAR-SERVIDO`
- `hostname`: `CUIABAR-SERVIDOR`
- `MachineGuid` Windows: `07cc493c-6a04-4e17-8a3e-5ae3d15dd96f`
- `UUID` SMBIOS/host: `03000200-0400-0500-0006-000700080009`
- Fabricante reportado: `To be filled by O.E.M.`
- Modelo reportado: `To be filled by O.E.M.`
- Serial BIOS reportado: `To be filled by O.E.M.`
- Ultimo boot observado: `2026-04-13 08:26:56 -03:00`

Observacao:

- `COMPUTERNAME` e `hostname` aparecem diferentes porque o nome NetBIOS ficou truncado.

## Bridge local do WhatsApp

- Tipo: `Baileys + WhatsApp Web`
- Health endpoint local: `http://127.0.0.1:8788/health`
- Runtime root principal: `C:\ProgramData\VillaCuiabar`
- Runtime do bridge: `C:\ProgramData\VillaCuiabar\whatsapp-baileys-runtime`
- Logs do bridge: `C:\ProgramData\VillaCuiabar\logs`
- QR atual: `C:\ProgramData\VillaCuiabar\logs\baileys-qr.png`
- Runtime auxiliar legado: `C:\Users\MICRO\AppData\Local\VillaCuiabar\whatsapp-baileys-runtime`
- Logs auxiliares legados: `C:\Users\MICRO\AppData\Local\VillaCuiabar\logs`

## Estado atual do bridge

Snapshot coletado em: `2026-04-13T14:46:41-03:00`

- `connection`: `qr_ready`
- `qrAvailable`: `true`
- `pairingMode`: `qr`
- `browserLabel`: `Windows/Desktop`
- `waVersion`: `2.3000.1037199011`
- `meId`: `null`
- Numero conectado: nenhum no momento
- `lastError`: `null`
- `reconnectAttempts`: `125`

Observacao:

- neste snapshot o bridge esta aguardando novo pareamento por QR
- nao existe hoje um `bridge_instance_id` persistente no codigo; a identidade operacional do bridge fica representada por `machineName`, runtime root e health endpoint

## Autostart / watchdog

Tarefas agendadas esperadas:

- `VillaCuiabar-WhatsAppBridge-Boot`
- `VillaCuiabar-WhatsAppBridge-User`
- `VillaCuiabar-WhatsAppBridge-Watchdog`

Estado observado no snapshot:

- todas em `Ready`

Script de status:

- `scripts/baileys-autostart-status.ps1`

## Cloudflare / Worker

- Projeto Worker: `cuiabar-crm`
- Dominio principal: `https://crm.cuiabar.com`
- Dominio de reservas: `https://reservas.cuiabar.com`
- Worker entrypoint: `worker/index.ts`
- Binding D1: `DB`
- Binding KV: `WHATSAPP_KV`
- Binding AI: `AI`

Ultima versao observada via `wrangler deployments list`:

- `b2fb21be-94ba-4d05-97ca-54dc2f4ee7dc`

## O que ainda nao existe como ID formal

Hoje o projeto nao mantem uma tabela ou arquivo proprio com estes IDs:

- `bridge_instance_id`
- `machine_instance_id` de aplicacao
- `host_registration_id`

Se isso for desejado, o caminho recomendado e criar um `app_settings` persistente com:

- `runtime_machine_id`
- `runtime_bridge_instance_id`
- `runtime_registered_at`

Assim o CRM e o bridge passam a se reconhecer com um identificador de aplicacao estavel, sem depender apenas do nome da maquina.
