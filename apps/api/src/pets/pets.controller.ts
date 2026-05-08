import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('pets')
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Get()
  findAll(@Query('clientId') clientId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.petsService.findAll(user.clinicId, clientId);
  }

  @Post()
  create(@Body() dto: CreatePetDto, @CurrentUser() user: JwtPayload) {
    return this.petsService.create(dto, user.clinicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.petsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto, @CurrentUser() user: JwtPayload) {
    return this.petsService.update(id, user.clinicId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.petsService.remove(id, user.clinicId, user.role as Role);
  }
}
