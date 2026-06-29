import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
  ) {}

  async create(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    userAgent?: string,
  ) {
    const hashedToken = await argon2.hash(refreshToken);

    const token = this.refreshRepository.create({
      hashedToken,
      expiresAt,
      userAgent,
      user: {
        id: userId,
      },
    });

    return await this.refreshRepository.save(token);
  }

  async findValidTokens(userId: string) {
    return await this.refreshRepository.find({
      where: {
        user: {
          id: userId,
        },
        revoked: false,
      },
    });
  }

  async findByUser(userId: string) {
  return await this.refreshRepository.find({
    where: {
      user: {
        id: userId,
      },
      revoked: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

  async updateToken(
    id: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    const hashedToken = await argon2.hash(
      refreshToken,
    );

    await this.refreshRepository.update(id, {
      hashedToken,
      expiresAt,
      revoked: false,
    });
  }

  async verifyToken(
    hashedToken: string,
    refreshToken: string,
  ) {
    return await argon2.verify(
      hashedToken,
      refreshToken,
    );
  }

  async revoke(id: string) {
  const resultado = await this.refreshRepository.update(
    id,
    {
      revoked: true,
    },
  );

  
}

  async revokeAll(userId: string) {
    const sesiones = await this.findValidTokens(
      userId,
    );

    for (const sesion of sesiones) {
      await this.revoke(sesion.id);
    }
  }

  

  async getSessions(userId: string) {
  return await this.refreshRepository.find({
    where: {
      user: {
        id: userId,
      },
      revoked: false,
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      revoked: true,
      userAgent: true,
    },
  });
}
}