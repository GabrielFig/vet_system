import {
  Controller, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('consultations')
export class ConsultationsController {
  constructor(private service: ConsultationsService) {}

  @Post(':id/note')
  createNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createNote(id, dto, user.sub, user.clinicId);
  }

  @Patch('notes/:noteId')
  updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: Partial<CreateNoteDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateNote(noteId, dto, user.sub, user.role as Role);
  }

  @Delete('notes/:noteId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param('noteId') noteId: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteNote(noteId, user.role as Role);
  }

  @Post(':id/prescriptions')
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createPrescription(id, dto, user.sub, user.clinicId);
  }

  @Post(':id/vaccinations')
  createVaccination(
    @Param('id') id: string,
    @Body() dto: CreateVaccinationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createVaccination(id, dto, user.sub, user.clinicId);
  }
}
