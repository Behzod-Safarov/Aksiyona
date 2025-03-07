import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withComponentInputBinding, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

const routes: Routes = [
  { path: '', redirectTo: 'deals', pathMatch: 'full' }, // Explicitly set pathMatch
  { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes').then(m => m.routes) },
  { path: 'deals', loadChildren: () => import('./app/features/deals/deals.routes').then(m => m.routes) },
  { path: '**', redirectTo: 'deals' }
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient()]
}).catch(err => console.error(err));
