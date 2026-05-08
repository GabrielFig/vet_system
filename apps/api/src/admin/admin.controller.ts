import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { PlanType, ClinicModuleType } from '@vet/shared-types';

@UseGuards(SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('clinics')
  findAll() {
    return this.service.findAllClinics();
  }

  @Get('clinics/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOneClinic(id);
  }

  @Post('clinics')
  create(@Body() dto: { name: string; slug: string; planType: PlanType }) {
    return this.service.createClinic(dto);
  }

  @Patch('clinics/:id')
  update(@Param('id') id: string, @Body() dto: { name?: string; planType?: PlanType; isActive?: boolean }) {
    return this.service.updateClinic(id, dto);
  }

  @Patch('clinics/:id/modules')
  setModules(@Param('id') id: string, @Body() dto: { modules: ClinicModuleType[] }) {
    return this.service.setModules(id, dto.modules);
  }
}
