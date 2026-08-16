import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { ScrapeUiSsoRepository } from './scrapeui-sso.repository';

const TICKET_TTL_MS = 60_000;

function ticketHash(ticket: string): string {
  return createHash('sha256').update(ticket).digest('hex');
}

export function isValidScrapeUiSsoSecret(received: string | undefined): boolean {
  const configured = process.env.SCRAPEUI_SSO_SECRET;
  if (!configured || configured.length < 32 || !received) return false;
  const expectedBuffer = Buffer.from(configured);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function safeScrapeUiSsoRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/launches';
  return value;
}

@Injectable()
export class ScrapeUiSsoService {
  constructor(private readonly repository: ScrapeUiSsoRepository) {}

  assertTrustedSecret(received: string | undefined) {
    if (!isValidScrapeUiSsoSecret(received)) throw new ForbiddenException();
  }

  async provision(dealerId: string, dealerName: string) {
    const identity = await this.repository.provisionDealer(dealerId.trim(), dealerName.trim());
    if (!identity.organization.apiKey) throw new Error('ScrapeUI Postiz organization has no API key');

    return {
      identityId: identity.id,
      organizationId: identity.organizationId,
      apiKey: identity.organization.apiKey,
    };
  }

  async issue(dealerId: string, dealerName: string) {
    const provisioned = await this.provision(dealerId, dealerName);

    const ticket = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TICKET_TTL_MS);
    await this.repository.issueTicket(provisioned.identityId, ticketHash(ticket), expiresAt);
    return {
      ticket,
      expiresAt: expiresAt.toISOString(),
      organizationId: provisioned.organizationId,
      apiKey: provisioned.apiKey,
    };
  }

  async consume(ticket: string) {
    const consumed = await this.repository.consumeTicket(ticketHash(ticket), new Date());
    if (!consumed) return null;
    return {
      organizationId: consumed.identity.organizationId,
      jwt: AuthService.signJWT({ id: consumed.identity.userId }),
    };
  }
}
