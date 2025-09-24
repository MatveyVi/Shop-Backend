import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsEmail()
  @IsString({
    message: 'Email is required',
  })
  email: string;

  @MinLength(6)
  @MaxLength(50)
  @IsString()
  password: string;
}
