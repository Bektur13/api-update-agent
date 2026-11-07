import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from 'octokit';
import type { FastifyInstance } from 'fastify';
import { verifyWebhookSignature } from '@app/core';
import { buildServer } from './app.js';

// Signature checking is tested in core; here we only care how the route reacts to its answer.
vi.mock('@app/core', () => ({ verifyWebhookSignature: vi.fn() }));
const verifyMock = vi.mocked(verifyWebhookSignature);

const payload = { action: 'created', installation: { id: 42 } };
const headers = {
  'content-type': 'application/json',
  'x-github-delivery': 'delivery-1',
  'x-github-event': 'installation',
  'x-hub-signature-256': 'sha256=anything',
};

describe('POST /webhooks', () => {
  let octokitApp: App;
  let server: FastifyInstance;

  beforeEach(() => {
    // The private key is never used because no API calls are made.
    octokitApp = new App({ appId: 1, privateKey: 'unused', webhooks: { secret: 'test-secret' } });
    server = buildServer({ octokitApp, webhookSecret: 'test-secret', logger: false });
  });

  afterEach(async () => {
    await server.close();
    verifyMock.mockReset();
  });

  it('passes verified events to octokit handlers', async () => {
    verifyMock.mockReturnValue(true);
    const handler = vi.fn();
    octokitApp.webhooks.on('installation.created', handler);

    const res = await server.inject({
      method: 'POST',
      url: '/webhooks',
      headers,
      payload: JSON.stringify(payload),
    });

    expect(res.statusCode).toBe(202);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]?.[0]).toMatchObject({ id: 'delivery-1', payload });
  });

  it('gives the verifier the exact raw bytes', async () => {
    verifyMock.mockReturnValue(true);
    const raw = '{ "action" :"created",  "installation":{"id":42} }';

    await server.inject({ method: 'POST', url: '/webhooks', headers, payload: raw });

    expect(verifyMock).toHaveBeenCalledWith('test-secret', Buffer.from(raw), 'sha256=anything');
  });

  it('rejects events that fail verification without running handlers', async () => {
    verifyMock.mockReturnValue(false);
    const handler = vi.fn();
    octokitApp.webhooks.on('installation.created', handler);

    const res = await server.inject({
      method: 'POST',
      url: '/webhooks',
      headers,
      payload: JSON.stringify(payload),
    });

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects requests missing GitHub headers', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/webhooks',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });

    expect(res.statusCode).toBe(400);
    expect(verifyMock).not.toHaveBeenCalled();
  });
});
