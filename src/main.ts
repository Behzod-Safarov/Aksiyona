import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withComponentInputBinding, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent } from './app/features/home/home.component';
import { DealDetailsComponent } from './app/features/deals/pages/deal-details/deal-details.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'deal/:id', component: DealDetailsComponent },
  { path: '**', redirectTo: '' } 
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient()]
}).catch(err => console.error(err));
