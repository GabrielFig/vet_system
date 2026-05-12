import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { SearchHistoryDto } from './dto/search-history.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@vet/shared-types';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private service: MedicalRecordsService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.clinicId);
  }

  @Post(':id/consultations')
  createConsultation(
    @Param('id') id: string,
    @Body() dto: CreateConsultationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createConsultation(id, dto, user.sub, user.clinicId);
  }

  @Get(':id/notes')
  searchNotes(@Param('id') id: string, @Query() dto: SearchHistoryDto, @CurrentUser() user: JwtPayload) {
    return this.service.searchNotes(id, user.clinicId, dto);
  }

  @Get(':id/prescriptions')
  searchPrescriptions(@Param('id') id: string, @Query() dto: SearchHistoryDto, @CurrentUser() user: JwtPayload) {
    return this.service.searchPrescriptions(id, user.clinicId, dto);
  }

  @Get(':id/vaccinations')
  searchVaccinations(@Param('id') id: string, @Query() dto: SearchHistoryDto, @CurrentUser() user: JwtPayload) {
    return this.service.searchVaccinations(id, user.clinicId, dto);
  }

  @Post(':id/qr')
  generateQr(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    return this.service.generateQr(id, user.clinicId, webUrl);
  }
}
