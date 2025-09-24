import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN = 7;
  REFRESH_TOKEN_NAME = 'refreshToken';
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  public async login(dto: AuthDto) {
    const user = await this.validateUser(dto.email);
    const tokens = await this.generateTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  public async register(dto: AuthDto) {
    const existingUser = await this.userService.getByEmail(dto.email);

    if (existingUser) throw new BadRequestException('User already exists');

    const user = await this.userService.create(dto);

    const tokens = this.generateTokens(user.id);
    return {
      user,
      ...tokens,
    };
  }

  public async refreshTokens(refreshToken: string) {
    const result = await this.jwtService.verifyAsync(refreshToken);
    if (!result) throw new UnauthorizedException('Not valid refreshToken');

    const user = await this.userService.getById(result.id);
    const tokens = await this.generateTokens(result.id);

    return {
      user,
      ...tokens,
    };
  }

  public async generateTokens(userId: string) {
    const data = { id: userId };

    const accessToken = this.jwtService.sign(data, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(data, {
      expiresIn: '7d',
    });

    return {
      refreshToken,
      accessToken,
    };
  }

  private async validateUser(email: string) {
    const user = await this.userService.getByEmail(email);

    if (!user) throw new NotFoundException('User is not found');

    return user;
  }

  public async validateOAuthLogin(req: any) {
    let user = await this.userService.getByEmail(req.user.email);

    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture,
        },
        include: {
          stores: true,
          favorites: true,
          orders: true,
        },
      });
    }
    const tokens = await this.generateTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  public addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);

    res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      domain: this.configService.getOrThrow<string>('SERVER_DOMAIN'),
      expires: expiresIn,
      sameSite: 'none',
    });
  }

  public removeRefreshTokenFromResponse(res: Response) {
    res.cookie(this.REFRESH_TOKEN_NAME, '', {
      httpOnly: true,
      domain: this.configService.getOrThrow<string>('SERVER_DOMAIN'),
      expires: new Date(0),
      sameSite: 'none',
    });
  }
}
