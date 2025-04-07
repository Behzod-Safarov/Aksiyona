// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withComponentInputBinding, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent } from './app/features/home/home.component';
import { DealDetailsComponent } from './app/features/deals/pages/deal-details/deal-details.component';
import { LoginComponent } from './app/features/auth/pages/login/login.component';
import { LikedComponent } from './app/features/liked/pages/liked/liked.component';
import { authGuard } from './app/features/auth/auth.guard';
import { ErrorComponent } from './app/shared/components/error/error.component';
import { DealcreateComponent } from './app/features/bussiness/dealcreate/dealcreate.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CabinetComponent } from './app/features/bussiness/cabinet/cabinet.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'deal/:id', component: DealDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'liked', component: LikedComponent, canActivate: [authGuard] },
  { path: 'createdeal', component: DealcreateComponent},
  {path: 'cabinet', component: CabinetComponent, canActivate: [authGuard]},
  { path: 'error', component: ErrorComponent },
  { path: '**', component: ErrorComponent, data: { errorCode: '404', message: 'Page Not Found' } },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding()),provideAnimations(), provideHttpClient()],
}).catch(err => console.error(err));