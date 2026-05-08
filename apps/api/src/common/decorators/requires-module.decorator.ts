import { SetMetadata } from '@nestjs/common';
import { ClinicModuleType } from '@vet/shared-types';

export const MODULE_KEY = 'requiredModule';
export const RequiresModule = (mod: ClinicModuleType) => SetMetadata(MODULE_KEY, mod);
