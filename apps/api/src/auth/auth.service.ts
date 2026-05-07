import {
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  JwtPayload,
  AuthResponse,
  ClinicSelectionRequired,
  LoginResult,
  Role,
} from '@vet/shared-types';
import { LoginDto } from './dto/login.dto';
import { SelectClinicDto } from './dto/select-clinic.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const clinicUsers = await this.prisma.clinicUser.findMany({
      where: { userId: user.id, isActive: true },
      include: { clinic: true },
    });

    if (clinicUsers.length === 0) {
      throw new UnauthorizedException('El usuario no está asociado a ninguna clínica activa');
    }

    if (clinicUsers.length === 1) {
      return this.buildAuthResponse(user, clinicUsers[0].clinic, clinicUsers[0].role as Role);
    }

    const tempToken = this.jwt.sign(
      { sub: user.id, type: 'clinic-selection' },
      { expiresIn: this.config.get('TEMP_TOKEN_EXPIRY', '5m') },
    );

    const response: ClinicSelectionRequired = {
      requiresClinicSelection: true,
      clinics: clinicUsers.map((cu) => ({
        id: cu.clinic.id,
        name: cu.clinic.name,
        slug: cu.clinic.slug,
        role: cu.role as Role,
      })),
      tempToken,
    };
    return response;
  }

  async selectClinic(dto: SelectClinicDto): Promise<AuthResponse> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(dto.tempToken) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('Token de selección inválido o expirado');
    }

    if (payload.type !== 'clinic-selection') {
      throw new UnauthorizedException('Token inválido');
    }

    const clinicUser = await this.prisma.clinicUser.findUnique({
      where: { clinicId_userId: { clinicId: dto.clinicId, userId: payload.sub } },
      include: { user: true, clinic: true },
    });

    if (!clinicUser || !clinicUser.isActive) {
      throw new UnauthorizedException('Acceso denegado a esta clínica');
    }

    return this.buildAuthResponse(clinicUser.user, clinicUser.clinic, clinicUser.role as Role);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const isBlacklisted = await this.redis.get(`bl:${refreshToken}`);
    if (isBlacklisted) throw new UnauthorizedException('TOKEN_EXPIRED');

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(refreshToken) as JwtPayload;
    } catch {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }

    const accessToken = this.signAccess(payload);
    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.redis.set(`bl:${refreshToken}`, '1', 'EX', ttlSeconds);
  }

  private buildAuthResponse(
    user: { id: string; email: string; firstName: string; lastName: string },
    clinic: { id: string; name: string; slug: string; planType: string },
    role: Role,
  ): AuthResponse {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      clinicId: clinic.id,
      role,
      email: user.email,
    };

    const accessToken = this.signAccess(jwtPayload);
    const refreshToken = this.jwt.sign(jwtPayload, {
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRY', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug, planType: clinic.planType as any },
      role,
    };
  }

  private signAccess(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRY', '15m'),
    });
  }
}
