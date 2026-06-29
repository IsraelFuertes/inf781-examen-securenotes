import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { UsersService } from '../users/users.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existe = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existe) {
      throw new BadRequestException(
        'El correo ya está registrado',
      );
    }

    const passwordHash = await argon2.hash(
      registerDto.password,
    );

    const usuario = await this.usersService.create({
      email: registerDto.email,
      password: passwordHash,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      email: usuario.email,
    });

    return {
      message: 'Usuario registrado correctamente',
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.usersService.findByEmail(
      loginDto.email,
    );

    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales incorrectas',
      );
    }

    const passwordCorrecto = await argon2.verify(
      usuario.password,
      loginDto.password,
    );

    if (!passwordCorrecto) {
      throw new UnauthorizedException(
        'Credenciales incorrectas',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      email: usuario.email,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: usuario.id,
      },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'refresh_temporal',
        expiresIn: '7d',
      },
    );

    await this.refreshTokensService.create(
      usuario.id,
      refreshToken,
      new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
    );

    return {
      message: 'Inicio de sesión correcto',
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret:
            process.env.JWT_REFRESH_SECRET ||
            'refresh_temporal',
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token inválido',
      );
    }

    const usuario = await this.usersService.findById(
      payload.sub,
    );

    if (!usuario) {
      throw new UnauthorizedException();
    }

    const sesiones = await this.refreshTokensService.findByUser(
    usuario.id,
  );
let sesionActual: any = null;

for (const sesion of sesiones) {
  const coincide = await argon2.verify(
    sesion.hashedToken,
    refreshToken,
  );

  

  if (coincide) {
    sesionActual = sesion;
    break;
  }
}

if (!sesionActual) {
  await this.refreshTokensService.revokeAll(
    usuario.id,
  );

  throw new UnauthorizedException(
    'Se detectó reutilización del refresh token',
  );
}
    await this.refreshTokensService.revoke(
            sesionActual.id,
    );
    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      email: usuario.email,
    });

    const nuevoRefreshToken =
  await this.jwtService.signAsync(
    {
      sub: usuario.id,
    },
    {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        'refresh_temporal',
      expiresIn: '7d',
    },
  );

  await this.refreshTokensService.create(
  usuario.id,
  nuevoRefreshToken,
  new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ),
);

    return {
  accessToken,
  refreshToken: nuevoRefreshToken,
};
}
  async logout(userId: string) {
    await this.refreshTokensService.revokeAll(
      userId,
    );

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async sessions(userId: string) {
  return await this.refreshTokensService.getSessions(
    userId,
  );
}

  async me(id: string) {
    const usuario = await this.usersService.findById(id);

    if (!usuario) {
      throw new UnauthorizedException();
    }

    return {
      id: usuario.id,
      email: usuario.email,
      createdAt: usuario.createdAt,
    };
  }
}