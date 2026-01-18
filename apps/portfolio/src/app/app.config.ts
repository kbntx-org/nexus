import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ROUTES } from './app.routes';

export const APP_CONFIG: ApplicationConfig = {
  providers: [provideRouter(ROUTES), provideHttpClient()]
};
