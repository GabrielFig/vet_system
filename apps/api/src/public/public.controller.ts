import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Get(':uuid')
  getRecord(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.publicService.getPublicRecord(uuid);
  }
}
