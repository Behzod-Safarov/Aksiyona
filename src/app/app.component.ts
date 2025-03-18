import { Component } from '@angular/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HomePageComponent } from "./features/home/home-page/home-page.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterModule, FormsModule, HomePageComponent],
  template: `
    <app-header></app-header>
    <app-home-page></app-home-page>

  `
})
export class AppComponent {}
