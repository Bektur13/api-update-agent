import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { App } from 'octokit';
import { verifyWebhookSignature } from '@app/core';

type WebhookEvent = Parameters<App['webhooks']['receive']>[0];

export interface BuildServerOptions {
  octokitApp: App;
  webhookSecret: string;
  logger?: FastifyServerOptions['logger'];
}

export function buildServer({
  octokitApp,
  webhookSecret,
  logger = true,
}: BuildServerOptions): FastifyInstance {
  const server = Fastify({ logger });

  // Keep the body as raw bytes: the signature is an HMAC of exactly what GitHub sent.
  server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body);
  });

  server.post('/webhooks', async (request, reply) => {
    const id = request.headers['x-github-delivery'];
    const name = request.headers['x-github-event'];
    const signature = request.headers['x-hub-signature-256'];

    if (typeof id !== 'string' || typeof name !== 'string' || !Buffer.isBuffer(request.body)) {
      return reply.code(400).send({ error: 'Not a GitHub webhook request' });
    }

    if (!verifyWebhookSignature(webhookSecret, request.body, signature as string | undefined)) {
      request.log.warn({ id, name }, 'Rejected webhook with invalid signature');
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(request.body.toString('utf8'));
    } catch {
      return reply.code(400).send({ error: 'Body is not valid JSON' });
    }

    // The header is an arbitrary string; octokit simply skips names with no handler.
    const event = { id, name, payload } as WebhookEvent;
    await octokitApp.webhooks.receive(event);
    return reply.code(202).send();
  });

  return server;
}
