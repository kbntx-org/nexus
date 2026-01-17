import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { getCodeSourceById } from '../data/data';

export const codeSourceGuard: CanActivateFn = route => {
  const router = inject(Router);
  const id = route.paramMap.get('id');

  if (!id || !getCodeSourceById(id)) {
    router.navigate(['/projects']);
    return false;
  }

  return true;
};

