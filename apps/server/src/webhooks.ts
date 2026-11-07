import type { App } from 'octokit';
import type { FastifyBaseLogger } from 'fastify';

export function registerWebhookHandlers(app: App, log: FastifyBaseLogger): void {
  app.webhooks.on('installation.created', ({ payload }) => {
    log.info({ installationId: payload.installation.id }, 'App installed');
  });

  app.webhooks.on('push', ({ payload }) => {
    log.info({ repo: payload.repository.full_name, ref: payload.ref }, 'Push received');
  });

  app.webhooks.onError((error) => {
    log.error({ err: error }, 'Webhook handler failed');
  });
}
