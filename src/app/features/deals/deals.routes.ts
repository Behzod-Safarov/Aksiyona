import { Routes } from '@angular/router';
import { DealsListComponent } from './pages/deals-list.component';
import { DealDetailComponent } from './pages/deal-detail.component';

export const routes: Routes = [
  { path: '', component: DealsListComponent },
  { path: ':id', component: DealDetailComponent }
];
