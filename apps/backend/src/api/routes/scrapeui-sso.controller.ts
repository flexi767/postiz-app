import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  ScrapeUiSsoConsumeDto,
  ScrapeUiSsoTicketDto,
} from '@gitroom/nestjs-libraries/dtos/auth/scrapeui-sso.dto';
import {
  safeScrapeUiSsoRedirect,
  ScrapeUiSsoService,
} from '@gitroom/nestjs-libraries/database/prisma/scrapeui-sso/scrapeui-sso.service';

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    ...(!process.env.NOT_SECURED
      ? {
          secure: true,
        }
      : {}),
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  };
}

function languageCookieOptions() {
  return {
    sameSite: 'lax' as const,
    path: '/',
    ...(!process.env.NOT_SECURED ? { secure: true } : {}),
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  };
}

@ApiTags('Auth')
@Controller('/auth/scrapeui-sso')
export class ScrapeUiSsoController {
  constructor(private readonly sso: ScrapeUiSsoService) {}

  @Post('/provision')
  async provision(
    @Headers('x-scrapeui-sso-secret') secret: string | undefined,
    @Body() body: ScrapeUiSsoTicketDto
  ) {
    this.sso.assertTrustedSecret(secret);
    const { organizationId, apiKey } = await this.sso.provision(
      body.dealerId,
      body.dealerName
    );
    return { organizationId, apiKey };
  }

  @Post('/ticket')
  issueTicket(
    @Headers('x-scrapeui-sso-secret') secret: string | undefined,
    @Body() body: ScrapeUiSsoTicketDto
  ) {
    this.sso.assertTrustedSecret(secret);
    return this.sso.issue(body.dealerId, body.dealerName);
  }

  @Get()
  async consumeTicket(
    @Query() query: ScrapeUiSsoConsumeDto,
    @Res({ passthrough: false }) response: Response
  ) {
    const session = await this.sso.consume(query.ticket);
    if (!session)
      throw new UnauthorizedException('Invalid or expired SSO ticket');

    response.cookie('auth', session.jwt, authCookieOptions());
    response.cookie('showorg', session.organizationId, authCookieOptions());
    response.cookie('i18next', query.locale ?? 'en', languageCookieOptions());
    if (process.env.NOT_SECURED) {
      response.header('auth', session.jwt);
      response.header('showorg', session.organizationId);
    }
    return response.redirect(
      302,
      `${process.env.FRONTEND_URL}${safeScrapeUiSsoRedirect(query.redirect)}`
    );
  }
}
