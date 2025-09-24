import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'argon2';
import { AuthDto } from '../auth/dto/auth.dto';

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

  public async create(dto: AuthDto) {
    return this.prismaService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hash(dto.password),
      },
    });
  }
}
