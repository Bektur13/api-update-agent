import { readFileSync } from 'node:fs';
import { App } from 'octokit';
import { buildServer } from './app.js';
import { registerWebhookHandlers } from './webhooks.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} (see apps/server/.env.example)`);
  }
  return value;
}

const webhookSecret = requireEnv('WEBHOOK_SECRET');
const octokitApp = new App({
  appId: requireEnv('APP_ID'),
  privateKey: readFileSync(requireEnv('PRIVATE_KEY_PATH'), 'utf8'),
  webhooks: { secret: webhookSecret },
});

const server = buildServer({ octokitApp, webhookSecret });
registerWebhookHandlers(octokitApp, server.log);

await server.listen({ port: Number(process.env.PORT ?? 3000), host: '127.0.0.1' });
