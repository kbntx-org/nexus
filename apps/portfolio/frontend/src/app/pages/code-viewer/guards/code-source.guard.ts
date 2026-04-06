import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { getCodeSourceById } from '../data/data';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const codeSourceGuard: CanActivateFn = route => {
  const router = inject(Router);
  const id = route.paramMap.get('id');
  console.log(`Attempting to access code source with id: ${id}`);

  if (!id || !getCodeSourceById(id)) {
    router.navigate(['/projects']);
    console.warn(`Code source with id '${id}' not found. Redirecting to projects page.`);
    return false;
  }

  return true;
};
