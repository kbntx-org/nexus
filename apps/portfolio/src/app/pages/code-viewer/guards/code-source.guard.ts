import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { getCodeSourceById } from '../data/data';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const codeSourceGuard: CanActivateFn = route => {
  const router = inject(Router);
  const id = route.paramMap.get('id');

  if (!id || !getCodeSourceById(id)) {
    router.navigate(['/projects']);
    return false;
  }

  return true;
};
