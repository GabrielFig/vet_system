import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
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
  findAll(@CurrentUser() user: JwtPayload) {
    return this.petsService.findAll(user.sub, user.clinicId, user.role);
  }

  @Post()
  create(@Body() dto: CreatePetDto, @CurrentUser() user: JwtPayload) {
    return this.petsService.create(dto, user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.petsService.remove(id, user.role as Role);
  }
}
