import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import { JwtPayload, Role, PlanType } from '@vet/shared-types';

@Controller()
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('pets/:id/record/pdf')
  async cartillaPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generateCartillaPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cartilla-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @RequiresPlan(PlanType.PRO)
  @Roles(Role.ADMIN)
  @Get('reports/monthly')
  async monthlyReport(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const buffer = await this.service.generateMonthlyReport(user.clinicId, m, y);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${y}-${String(m).padStart(2, '0')}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
