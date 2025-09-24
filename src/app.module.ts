import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UserModule],
  providers: [PrismaService],
})
export class AppModule {}
