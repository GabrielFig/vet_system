import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtPayload } from '@vet/shared-types';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload; clinicId?: string }>();
    if (request.user?.clinicId) {
      request.clinicId = request.user.clinicId;
    }
    return next.handle();
  }
}
