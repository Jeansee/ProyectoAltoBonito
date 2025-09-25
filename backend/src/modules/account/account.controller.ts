import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountService } from './account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.account.me(req.user.userId);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.account.updateProfile(req.user.userId, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.account.changePassword(req.user.userId, dto);
  }
}
