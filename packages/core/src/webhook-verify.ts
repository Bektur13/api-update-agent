/**
 * Checks that a webhook request really came from GitHub.
 *
 * @param secret          The webhook secret configured on the GitHub App.
 * @param rawBody         The exact request body bytes, before any JSON parsing.
 * @param signatureHeader The `x-hub-signature-256` header, e.g. `sha256=ab12...`.
 * @returns true only if the signature is present and matches.
 */
export function verifyWebhookSignature(
  secret: string,
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  // TODO(human): compute the HMAC and compare it to signatureHeader.
  void secret;
  void rawBody;
  void signatureHeader;
  throw new Error('verifyWebhookSignature is not implemented yet');
}
