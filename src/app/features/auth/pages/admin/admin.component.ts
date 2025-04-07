import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserDto } from '../../../../core/models/user-dto';
import { DealDto } from '../../../../core/models/deal-dto';
import { ApiService } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class AdminComponent implements OnInit {
  activeSection: 'users' | 'deals' | 'new-deals' = 'users';
  users$: Observable<UserDto[]> = of([]);
  activeDeals$: Observable<DealDto[]> = of([]);
  pendingDeals$: Observable<DealDto[]> = of([]);
  selectedDeal: DealDto | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  setActiveSection(section: 'users' | 'deals' | 'new-deals'): void {
    this.activeSection = section;
    this.errorMessage = null;
    this.successMessage = null;
    this.selectedDeal = null;

    if (section === 'users') {
      this.loadUsers();
    } else if (section === 'deals') {
      this.loadActiveDeals();
    } else if (section === 'new-deals') {
      this.loadPendingDeals();
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.users$ = this.apiService.getAllUsers();
    this.users$.subscribe({
      next: () => (this.isLoading = false),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load users. Please try again.';
        console.error('Error loading users:', err);
      },
    });
  }

  loadActiveDeals(): void {
    this.isLoading = true;
    this.activeDeals$ = this.apiService.getActiveDeals();
    this.activeDeals$.subscribe({
      next: () => (this.isLoading = false),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load active deals. Please try again.';
        console.error('Error loading active deals:', err);
      },
    });
  }

  loadPendingDeals(): void {
    this.isLoading = true;
    this.pendingDeals$ = this.apiService.getPendingDeals();
    this.pendingDeals$.subscribe({
      next: () => (this.isLoading = false),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load pending deals. Please try again.';
        console.error('Error loading pending deals:', err);
      },
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.isLoading = true;
      this.apiService.deleteUser(userId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'User deleted successfully!';
          this.loadUsers();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to delete user. Please try again.';
          console.error('Error deleting user:', err);
        },
      });
    }
  }

  editDeal(deal: DealDto): void {
    this.selectedDeal = { ...deal };
  }

  saveDeal(): void {
    if (!this.selectedDeal) return;

    this.isLoading = true;
    this.apiService.updateDeal(this.selectedDeal.id, this.selectedDeal).subscribe({
      next: (updatedDeal) => {
        this.isLoading = false;
        this.successMessage = 'Deal updated successfully!';
        this.selectedDeal = null;
        this.loadActiveDeals();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to update deal. Please try again.';
        console.error('Error updating deal:', err);
      },
    });
  }

  cancelEdit(): void {
    this.selectedDeal = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  deleteDeal(dealId: number): void {
    if (confirm('Are you sure you want to delete this deal?')) {
      this.isLoading = true;
      this.apiService.deleteDeal(dealId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Deal deleted successfully!';
          if (this.activeSection === 'deals') {
            this.loadActiveDeals();
          } else {
            this.loadPendingDeals();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to delete deal. Please try again.';
          console.error('Error deleting deal:', err);
        },
      });
    }
  }

  activateDeal(dealId: number): void {
    if (confirm('Are you sure you want to activate this deal?')) {
      this.isLoading = true;
      this.apiService.activateDeal(dealId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Deal activated successfully!';
          this.loadPendingDeals();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to activate deal. Please try again.';
          console.error('Error activating deal:', err);
        },
      });
    }
  }

  viewDealDetails(deal: DealDto): void {
    this.selectedDeal = { ...deal };
  }
}