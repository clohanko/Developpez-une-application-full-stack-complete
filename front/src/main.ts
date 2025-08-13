// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';

// Si tu utilises HttpClient en standalone :
import { provideHttpClient } from '@angular/common/http';
// Si tu as des interceptors, tu peux faire :
// import { provideHttpClient, withInterceptors } from '@angular/common/http';
// ... puis provideHttpClient(withInterceptors([tonInterceptor]))

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(),
  ],
}).catch(err => console.error(err));
