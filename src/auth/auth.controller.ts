import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const resultado =
    await this.authService.login(loginDto);

  res.cookie(
    'refreshToken',
    resultado.refreshToken,
    {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  );

  return {
    message: resultado.message,
    accessToken: resultado.accessToken,
  };
}

  @Post('refresh')
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies.refreshToken;

  const resultado = await this.authService.refresh(
    refreshToken,
  );

  res.cookie(
    'refreshToken',
    resultado.refreshToken,
    {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  );

  return {
    accessToken: resultado.accessToken,
  };
}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @GetUser() user: any,
  ) {
    return this.authService.logout(
      user.id,
    );
  }



  @UseGuards(JwtAuthGuard)
@Get('sessions')
async sessions(
  @GetUser() user: any,
) {
  return this.authService.sessions(
    user.id,
  );
}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(
    @GetUser() user: any,
  ) {
    return this.authService.me(user.id);
  }
}