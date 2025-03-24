import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service'; // Adjust path as per your structure
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private apiService: ApiService, private router: Router) {
    console.log('LoginComponent initialized');
  }

  onSubmit() {
    this.errorMessage = ''; // Reset error message
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.apiService.login(this.username, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token); // Store JWT token
        console.log('Login successful:', response);
        this.router.navigate(['/dashboard']); // Redirect to dashboard on success
      },
      error: (err) => {
        this.errorMessage = err.error || 'Invalid username or password.';
        console.error('Login failed:', err);
      }
    });
  }
}