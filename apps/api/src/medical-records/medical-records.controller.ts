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
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
  searchNotes(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchNotes(id, dto);
  }

  @Get(':id/prescriptions')
  searchPrescriptions(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchPrescriptions(id, dto);
  }

  @Get(':id/vaccinations')
  searchVaccinations(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchVaccinations(id, dto);
  }

  @Post(':id/qr')
  generateQr(@Param('id') id: string) {
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    return this.service.generateQr(id, webUrl);
  }
}
