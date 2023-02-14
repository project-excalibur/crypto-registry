import { BadRequestException, Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  CredentialsDto,
  RegisterUserDto,
  ResetPasswordDto,
  SignInDto,
  SignInTokens,
  VerifyUserDto
} from '../types/user.types';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { RefreshTokenCookies } from './refresh-token-cookies';
import { Request, Response } from 'express';

@Controller('user')
export class UserController {

  constructor(
    private userService: UserService
  ) {
  }

  @Post('register')
  @ApiBody({ type: RegisterUserDto })
  async registerUser(
    @Body() registerUserDto: RegisterUserDto
  ) {
    await this.userService.registerUser(registerUserDto);
  }

  @Post('verify')
  @ApiBody({ type: VerifyUserDto })
  @HttpCode(200)
  async verifyUser(
    @Body() verifyUserDto: VerifyUserDto
  ) {
    await this.userService.verifyUser(verifyUserDto);
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ type: CredentialsDto})
  @HttpCode(200)
  async resetPassword(
    @Res({ passthrough: true }) response: Response,
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<CredentialsDto> {
    const signInTokens = await this.userService.resetPassword(resetPasswordDto);
    RefreshTokenCookies.set(response, signInTokens);
    return {
      idToken: signInTokens.idToken,
      userId: signInTokens.userId,
    }
  }

  @Post('sign-in')
  @ApiBody({ type: SignInDto })
  @ApiResponse({ type: CredentialsDto})
  @HttpCode(200)
  async signInUser(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto
  ):  Promise<CredentialsDto>  {
    const signInTokens = await this.userService.signIn(signInDto);
    RefreshTokenCookies.set(response, signInTokens);
    return {
      idToken: signInTokens.idToken,
      userId: signInTokens.userId,
    }
  }

  @Post('sign-out')
  @HttpCode(200)
  signOut(
    @Res({ passthrough: true }) response: Response
  ) {
    RefreshTokenCookies.clear(response);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request
  ): Promise<CredentialsDto> {
    const refreshToken = request.cookies['refresh-token'];
    if (!refreshToken) {
      throw new BadRequestException('No refresh token');
    }
    RefreshTokenCookies.clear(response);
    const credentials = await this.userService.refreshToken(refreshToken);
    RefreshTokenCookies.set(response, credentials);
    return {
      userId: credentials.userId,
      idToken: credentials.idToken
    };
  }
}
