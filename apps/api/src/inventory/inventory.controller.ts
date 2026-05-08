import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequiresModule } from '../common/decorators/requires-module.decorator';
import { JwtPayload, Role, ClinicModuleType } from '@vet/shared-types';

@RequiresModule(ClinicModuleType.INVENTORY)
@Controller()
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get('products')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Post('products')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Patch('products/:id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.clinicId);
  }

  @Get('products/:id/movements')
  getMovements(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.getMovements(id, user.clinicId);
  }

  @Post('products/:id/movements')
  createMovement(
    @Param('id') id: string,
    @Body() dto: CreateMovementDto & { appointmentId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createMovement(id, dto, user.sub, user.clinicId, dto.appointmentId);
  }

  @Get('inventory/low-stock')
  getLowStock(@CurrentUser() user: JwtPayload) {
    return this.service.getLowStock(user.clinicId);
  }
}
