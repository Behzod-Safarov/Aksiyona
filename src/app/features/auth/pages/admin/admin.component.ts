import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { UserDto } from '../../../../core/models/user-dto';
import { DealDto } from '../../../../core/models/deal-dto';
import { ApiService } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../../../core/constants/api_urls';

@Component({  
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class AdminComponent implements OnInit, OnDestroy {
  activeSection: 'users' | 'deals' | 'new-deals' = 'users';
  activeDeals$: Observable<DealDto[]> = of([]);
  pendingDeals$: Observable<DealDto[]> = of([]);
  users$: Observable<UserDto[]> = of([]);
  
  // Local state for immediate UI updates
  activeDeals: DealDto[] = [];
  users: UserDto[] = [];
  selectedDeal: DealDto | null = null;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private readonly BASE_URL = API_URLS.BASE_URL; // Centralized constant
  private destroy$ = new Subject<void>(); // For unsubscribing

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveSection(section: 'users' | 'deals' | 'new-deals'): void {
    this.activeSection = section;
    this.resetMessagesAndSelection();
    
    switch (section) {
      case 'users':
        this.loadUsers();
        break;
      case 'deals':
        this.loadActiveDeals();
        break;
      case 'new-deals':
        this.loadPendingDeals();
        break;
    }
  }

  private resetMessagesAndSelection(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.selectedDeal = null;
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.users$ = this.apiService.getAllUsers().pipe(
      map((users: UserDto[]) => users || []), // Ensure non-null array
      catchError((err) => this.handleError(err, 'Failed to load users')),
      takeUntil(this.destroy$)
    );

    this.users$.subscribe((users) => {
      this.users = users;
      this.isLoading = false;
      console.log('Users loaded:', users);
    });
  }

  private loadActiveDeals(): void {
    this.isLoading = true;
    this.activeDeals$ = this.apiService.getActiveDeals().pipe(
      map((deals: DealDto[]) => this.mapDeals(deals)),
      catchError((err) => this.handleError(err, 'Failed to load active deals')),
      takeUntil(this.destroy$)
    );

    this.activeDeals$.subscribe((deals) => {
      this.activeDeals = deals;
      this.isLoading = false;
      console.log('Active deals loaded:', deals);
    });
  }

  private loadPendingDeals(): void {
    this.isLoading = true;
    this.pendingDeals$ = this.apiService.getPendingDeals().pipe(
      map((deals: DealDto[]) => this.mapDeals(deals)),
      catchError((err) => this.handleError(err, 'Failed to load pending deals')),
      takeUntil(this.destroy$)
    );

    this.pendingDeals$.subscribe(() => (this.isLoading = false));
  }

  private mapDeals(deals: DealDto[]): DealDto[] {
    return (deals || []).map((deal) => {
      const imageUrl = deal.image?.trim()
        ? `${this.BASE_URL}${deal.image.split(',')[0].trim()}`
        : `${this.BASE_URL}/images/placeholder.jpg`;

      const discount = deal.oldPrice > 0
        ? Math.round(((deal.oldPrice - deal.price) / deal.oldPrice) * 100)
        : deal.discount || 0;

      return {
        ...deal,
        image: imageUrl,
        discount,
        category: deal.subcategoryId ? `Subcategory ${deal.subcategoryId}` : 'Uncategorized',
      };
    });
  }

  deleteUser(userId: number): void {
    console.log('Delete User button clicked, ID:', userId); // Log on click
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.isLoading = true;
    this.apiService.deleteUser(userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.handleSuccess('User deleted successfully!', this.loadUsers.bind(this)),
      error: (err) => this.handleError(err, 'Failed to delete user'),
    });
  }
  
  editDeal(deal: DealDto): void {
    console.log('Edit Deal button clicked, Deal:', deal); // Log on click
    this.selectedDeal = { ...deal };
  }

  saveDeal(): void {
    if (!this.selectedDeal) return;

    this.isLoading = true;
    this.apiService.updateDeal(this.selectedDeal.id, this.selectedDeal).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.handleSuccess('Deal updated successfully!', this.loadActiveDeals.bind(this), () => (this.selectedDeal = null)),
      error: (err) => this.handleError(err, 'Failed to update deal'),
    });
  }

  cancelEdit(): void {
    this.resetMessagesAndSelection();
  }

  deleteDeal(dealId: number): void {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    this.isLoading = true;
    this.apiService.deleteDeal(dealId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.handleSuccess('Deal deleted successfully!', this.activeSection === 'deals' ? this.loadActiveDeals.bind(this) : this.loadPendingDeals.bind(this)),
      error: (err) => this.handleError(err, 'Failed to delete deal'),
    });
  }

  activateDeal(dealId: number): void {
    if (!confirm('Are you sure you want to activate this deal?')) return;

    this.isLoading = true;
    this.apiService.activateDeal(dealId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.handleSuccess('Deal activated successfully!', this.loadPendingDeals.bind(this)),
      error: (err) => this.handleError(err, 'Failed to activate deal'),
    });
  }

  viewDealDetails(deal: DealDto): void {
    this.selectedDeal = { ...deal };

    console.log('Deal details:', this.selectedDeal);
  }

  private handleSuccess(message: string, reloadFn: () => void, additionalAction?: () => void): void {
    this.isLoading = false;
    this.successMessage = message;
    reloadFn();
    if (additionalAction) additionalAction();
  }

  private handleError(err: any, message: string): Observable<any> {
    this.isLoading = false;
    this.errorMessage = `${message}. Please try again.`;
    console.error(message, err);
    return of([]);
  }
}