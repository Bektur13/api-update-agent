import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from './webhook-verify.js';

// Test vector from GitHub's docs ("Validating webhook deliveries").
const secret = "It's a Secret to Everybody";
const body = Buffer.from('Hello, World!');
const validSignature = 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17';

// Skipped until verifyWebhookSignature is implemented; remove `.skip` to run.
describe.skip('verifyWebhookSignature', () => {
  it('accepts the signature GitHub would send', () => {
    expect(verifyWebhookSignature(secret, body, validSignature)).toBe(true);
  });

  it('rejects a signature made with the wrong secret', () => {
    const forged = 'sha256=' + createHmac('sha256', 'wrong').update(body).digest('hex');
    expect(verifyWebhookSignature(secret, body, forged)).toBe(false);
  });

  it('rejects a body that was changed after signing', () => {
    expect(verifyWebhookSignature(secret, Buffer.from('Hello, World?'), validSignature)).toBe(
      false,
    );
  });

  it('rejects a missing header', () => {
    expect(verifyWebhookSignature(secret, body, undefined)).toBe(false);
  });

  it('rejects a header with the wrong length or prefix', () => {
    expect(verifyWebhookSignature(secret, body, 'sha256=abc')).toBe(false);
    expect(verifyWebhookSignature(secret, body, validSignature.replace('sha256=', 'sha1='))).toBe(
      false,
    );
  });
});
