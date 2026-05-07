import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Public()
  @Get(':uuid')
  getRecord(@Param('uuid') uuid: string) {
    return this.publicService.getPublicRecord(uuid);
  }
}
