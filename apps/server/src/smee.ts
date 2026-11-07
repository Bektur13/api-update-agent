// Dev only: forwards webhooks from a smee.io channel to the local server.
// The smee CLI can't read the channel URL from .env, so this wraps the library.
import SmeeClient from 'smee-client';

const source = process.env.WEBHOOK_PROXY_URL;
if (!source) {
  throw new Error('Missing WEBHOOK_PROXY_URL (create a channel at https://smee.io/new)');
}

const port = process.env.PORT ?? '3000';
const smee = new SmeeClient({
  source,
  target: `http://127.0.0.1:${port}/webhooks`,
  logger: console,
});
await smee.start();
