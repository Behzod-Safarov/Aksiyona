import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnDestroy {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  userId: number | null = null;
  userRole: string | null = null;
  private roleSubscription: Subscription | undefined;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private authService: AuthService
  ) {
    console.log('LoginComponent initialized');
  }

  onSubmit() {
    this.errorMessage = ''; // Reset error message
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.apiService.login(this.username, this.password).subscribe({
      next: (response) => {
        // Store the token
        this.authService.setToken(response.token);
        this.isLoading = false;

        console.log('Login successful, token stored:', response.token);

        // Initialize user data from the token
        this.authService.initializeUser();
        
        // Subscribe to userRole$ to get the role after initialization
        this.roleSubscription = this.authService.userRole$.subscribe(role => {
          this.userRole = role;
          if (role) {
            this.navigateBasedOnRole(role);
          } else {
            this.errorMessage = 'User role not found in token.';
            console.error('No role found after initialization');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid username or password.';
        console.error('Login failed:', err);
      }
    });
  }

  private navigateBasedOnRole(role: string) {
    if (role === 'Admin') {
      this.router.navigate(['admin']);
    } else if (role === 'Business') { // Updated to match your AuthService's "Business" role
      this.router.navigate(['cabinet']);
    } else {
      this.router.navigate(['/']); // Default route
    }
  }

  ngOnDestroy() {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }
}