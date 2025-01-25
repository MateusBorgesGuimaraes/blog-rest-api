import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class TokenPayloadDto {
  @IsNumber()
  @Type(() => Number)
  sub: number;

  @IsEmail()
  @Type(() => String)
  email: string;

  @IsString()
  @Type(() => String)
  role: string;

  @IsNumber()
  @Type(() => Number)
  iat: number;

  @IsNumber()
  @Type(() => Number)
  exp: number;

  @IsString()
  @Type(() => String)
  aud: string;

  @IsString()
  @Type(() => String)
  iss: string;
}
