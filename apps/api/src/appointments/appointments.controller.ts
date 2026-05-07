import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get('schedule')
  getSchedule(@CurrentUser() user: JwtPayload) {
    return this.service.getSchedule(user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Post('schedule')
  upsertSchedule(@Body() dto: UpdateScheduleDto, @CurrentUser() user: JwtPayload) {
    return this.service.upsertSchedule(user.clinicId, dto);
  }

  @Roles(Role.ADMIN)
  @Post('schedule/exceptions')
  createException(@Body() dto: CreateExceptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.createException(user.clinicId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('schedule/exceptions/:exId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteException(@Param('exId') exId: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteException(exId, user.clinicId);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getAvailableSlots(user.clinicId, date);
  }

  @Get()
  findAll(@Query() dto: QueryAppointmentsDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.clinicId, dto);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.clinicId, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.clinicId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto, @CurrentUser() user: JwtPayload) {
    return this.service.updateStatus(id, dto, user.clinicId);
  }
}
