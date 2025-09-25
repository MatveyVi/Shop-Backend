import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash, verify } from 'argon2';
import { LoginUserDto, RegisterUserDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        stores: true,
        favorites: true,
        orders: true,
      },
    });

    return user;
  }

  public async getByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        stores: true,
        favorites: true,
        orders: true,
      },
    });

    return user;
  }

  public async create(dto: RegisterUserDto) {
    return this.prismaService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hash(dto.password),
      },
    });
  }

  public async verifyUserCredentials(dto: LoginUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    if (!user) throw new BadRequestException('Not valid email or password');
    if (!user.password)
      throw new BadRequestException('Use google sign-in for this account');
    const isPassValid = await verify(user.password, dto.password);
    if (!isPassValid)
      throw new BadRequestException('Not valid email or password');

    return user;
  }
}
