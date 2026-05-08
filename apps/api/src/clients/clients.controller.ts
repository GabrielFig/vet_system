import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  findAll(@Query('q') q: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.clinicId, q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.clinicId);
  }

  @Post()
  create(
    @Body() dto: { firstName: string; lastName: string; phone?: string; email?: string; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(user.clinicId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; email?: string; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.clinicId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.deactivate(id, user.clinicId);
  }
}
