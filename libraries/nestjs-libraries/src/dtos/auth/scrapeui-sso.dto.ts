import {
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ScrapeUiSsoTicketDto {
  @IsString()
  @IsDefined()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  dealerId: string;

  @IsString()
  @IsDefined()
  @MinLength(1)
  @MaxLength(128)
  dealerName: string;
}

export class ScrapeUiSsoConsumeDto {
  @IsString()
  @IsDefined()
  @MinLength(32)
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  ticket: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  redirect?: string;

  @IsString()
  @IsOptional()
  @IsIn(['bg', 'en', 'de', 'ru'])
  locale?: string;
}
