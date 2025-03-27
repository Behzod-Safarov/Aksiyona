import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error',
  standalone:true,
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
})
export class ErrorComponent {
  constructor(private router: Router) {}

  reloadPage() {
    window.location.reload();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}