import { Injectable } from '@nestjs/common';
import { Period, Provider, Role, SubscriptionTier } from '@prisma/client';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

@Injectable()
export class ScrapeUiSsoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private identityByDealerId(dealerId: string) {
    return this.prisma.scrapeUiSsoIdentity.findUnique({
      where: { dealerId },
      include: { organization: true, user: true },
    });
  }

  async provisionDealer(dealerId: string, dealerName: string) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.scrapeUiSsoIdentity.findUnique({
          where: { dealerId },
          include: { organization: true, user: true },
        });
        if (existing) {
          const apiKey = existing.organization.apiKey || AuthService.fixedEncryption(makeId(20));
          await Promise.all([
            transaction.organization.update({
              where: { id: existing.organizationId },
              data: { name: dealerName, apiKey },
            }),
            transaction.user.update({
              where: { id: existing.userId },
              data: { name: dealerName },
            }),
          ]);
          return { ...existing, organization: { ...existing.organization, name: dealerName, apiKey } };
        }

        const user = await transaction.user.create({
          data: {
            email: `scrapeui+${dealerId}@postiz.invalid`,
            providerName: Provider.GENERIC,
            providerId: `scrapeui:${dealerId}`,
            name: dealerName,
            timezone: 0,
            activated: true,
          },
        });
        const organization = await transaction.organization.create({
          data: {
            name: dealerName,
            apiKey: AuthService.fixedEncryption(makeId(20)),
            isTrailing: false,
            subscription: {
              create: {
                totalChannels: 1000000,
                subscriptionTier: SubscriptionTier.ULTIMATE,
                isLifetime: true,
                period: Period.YEARLY,
              },
            },
            users: {
              create: {
                role: Role.SUPERADMIN,
                userId: user.id,
              },
            },
          },
        });
        return transaction.scrapeUiSsoIdentity.create({
          data: {
            dealerId,
            organizationId: organization.id,
            userId: user.id,
          },
          include: { organization: true, user: true },
        });
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const existing = await this.identityByDealerId(dealerId);
      if (!existing) throw error;
      return existing;
    }
  }

  async issueTicket(identityId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.scrapeUiSsoTicket.deleteMany({
        where: {
          identityId,
          OR: [{ expiresAt: { lte: new Date() } }, { consumedAt: { not: null } }],
        },
      });
      return transaction.scrapeUiSsoTicket.create({
        data: { identityId, tokenHash, expiresAt },
      });
    });
  }

  consumeTicket(tokenHash: string, now: Date) {
    return this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.scrapeUiSsoTicket.updateMany({
        where: {
          tokenHash,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return null;
      return transaction.scrapeUiSsoTicket.findUnique({
        where: { tokenHash },
        include: { identity: true },
      });
    });
  }
}
