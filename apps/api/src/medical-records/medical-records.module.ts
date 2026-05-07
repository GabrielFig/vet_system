import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MedicalRecordsController, ConsultationsController],
  providers: [MedicalRecordsService, ConsultationsService, PrismaService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
