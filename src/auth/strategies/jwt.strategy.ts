import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RefreshTokensService } from '../../refresh-tokens/refresh-tokens.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly refreshTokensService: RefreshTokensService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: any) {
    const sesiones =
      await this.refreshTokensService.findValidTokens(
        payload.sub,
      );

    if (sesiones.length === 0) {
      throw new UnauthorizedException(
        'Sesión inválida',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}