import { Component } from '@angular/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterModule, FormsModule, CommonModule], // Add CommonModule here
  template: `
    <app-header *ngIf="!isAdminPage()"></app-header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private router: Router) {}

  isAdminPage(): boolean {
    return this.router.url.startsWith('/admin');
  }
}