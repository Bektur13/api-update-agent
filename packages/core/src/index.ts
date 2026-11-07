export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export { verifyWebhookSignature } from './webhook-verify.js';
