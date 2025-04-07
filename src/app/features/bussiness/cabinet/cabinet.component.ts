import { Component, OnInit } from '@angular/core';
import { Observable, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DealDto } from '../../../core/models/deal-dto';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { SubcategoryDto } from '../../../core/models/sub-category-dto';

@Component({
  selector: 'app-cabinet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cabinet.component.html',
  styleUrls: ['./cabinet.component.scss']
})
export class CabinetComponent implements OnInit {
  userId: number | null = null;
  userDeals$: Observable<DealDto[]>;
  editingDeal: DealDto | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private readonly BASE_URL = 'http://localhost:5251';
  categories: { name: string; isOpen: boolean; subcategories: SubcategoryDto[] }[] = [];
  previewImages: string[] = [];
  imageFiles: File[] = [];
  maxImages = 4;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize userDeals$ observable to fetch deals for the logged-in user
    this.userDeals$ = this.authService.userId$.pipe(
      switchMap((userId: number | null): Observable<DealDto[]> => {
        if (!userId) {
          this.errorMessage = 'You must be logged in to view your deals';
          this.router.navigate(['/login']);
          return of([] as DealDto[]);
        }
        this.userId = userId;
        return this.apiService.getDealByUserId(userId).pipe(
          map((deals: DealDto[]) => {
            return deals.map(deal => ({
              ...deal,
              image: deal.image
                ? `${this.BASE_URL}${deal.image.split(',').map(img => img.trim())[0]}`
                : `${this.BASE_URL}/images/placeholder.jpg`
            }));
          })
        );
      })
    );
  }

  ngOnInit(): void {
    // Redirect to login if the user is not logged in
    if (!this.authService.isLoggedIn()) {
      localStorage.setItem('redirectUrl', this.router.url); // Store the current URL for redirect after login
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({
          name: cat.name,
          isOpen: false,
          subcategories: cat.subcategories
        }));
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories. Please try again.';
      }
    });
  }

  toggleCategory(category: { name: string; isOpen: boolean; subcategories: SubcategoryDto[] }) {
    category.isOpen = !category.isOpen;
  }

  selectCategory(category: string, subcategory: string, subcategoryId: number) {
    if (this.editingDeal) {
      this.editingDeal.category = category;
      this.editingDeal.subcategoryId = subcategoryId;
    }
  }

  startEditing(deal: DealDto): void {
    this.editingDeal = { ...deal };
    this.previewImages = deal.image
      ? deal.image.split(',').map(img => `${this.BASE_URL}${img.trim()}`)
      : [];
    this.imageFiles = [];
    this.errorMessage = null;
    this.successMessage = null;
  }

  cancelEditing(): void {
    this.editingDeal = null;
    this.previewImages = [];
    this.imageFiles = [];
    this.errorMessage = null;
    this.successMessage = null;
  }

  onImageUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const remainingSlots = this.maxImages - this.imageFiles.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        this.imageFiles.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          this.previewImages.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });

      if (files.length > remainingSlots) {
        this.errorMessage = `Maximum ${this.maxImages} images allowed. Excess images ignored.`;
      }
    }
  }

  removeImage(index: number) {
    this.previewImages.splice(index, 1);
    if (index < this.imageFiles.length) {
      this.imageFiles.splice(index, 1);
    }
    this.errorMessage = null;
  }

  calculateDiscount() {
    if (this.editingDeal && this.editingDeal.oldPrice && this.editingDeal.price) {
      this.editingDeal.discount = Math.round(
        ((this.editingDeal.oldPrice - this.editingDeal.price) / this.editingDeal.oldPrice) * 100
      );
    }
  }

  saveDeal(): void {
    if (!this.editingDeal || !this.userId) {
      this.errorMessage = 'Cannot save deal. User or deal data is missing.';
      return;
    }
  
    // Validate required fields
    if (
      !this.editingDeal.title ||
      !this.editingDeal.price ||
      !this.editingDeal.oldPrice ||
      !this.editingDeal.expiryDate ||
      !this.editingDeal.subcategoryId
    ) {
      this.errorMessage = 'Please fill in all required fields (title, price, old price, expiry date, category).';
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
  
    const formData = new FormData();
    formData.append('Id', this.editingDeal.id.toString()); // Capitalize to match C# property
    formData.append('Title', this.editingDeal.title); // Capitalize
    formData.append('Price', this.editingDeal.price.toString()); // Capitalize
    formData.append('OldPrice', this.editingDeal.oldPrice?.toString() || '0'); // Capitalize
    formData.append('Discount', this.editingDeal.discount.toString()); // Capitalize
    formData.append('Rating', this.editingDeal.rating.toString()); // Capitalize
    formData.append('Reviews', this.editingDeal.reviews.toString()); // Capitalize
    formData.append('ExpiryDate', new Date(this.editingDeal.expiryDate).toISOString()); // Capitalize
    formData.append('Liked', this.editingDeal.liked.toString()); // Capitalize
    formData.append('SubcategoryId', this.editingDeal.subcategoryId.toString()); // Capitalize
    formData.append('Stock', this.editingDeal.stock?.toString() || '100'); // Capitalize
    formData.append('CreatedAt', new Date(this.editingDeal.createdAt).toISOString()); // Capitalize
    formData.append('DealStartingDate', new Date(this.editingDeal.dealStartingDate).toISOString()); // Capitalize
    formData.append('Location', this.editingDeal.location || ''); // Capitalize
    formData.append('UserId', this.userId.toString()); // Capitalize
  
    // Add images if any
    this.imageFiles.forEach((file) => {
      formData.append('Images', file, file.name); // Capitalize to match C# property
    });
  
    // Log FormData for debugging
    for (const pair of (formData as any).entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
  
    this.apiService.updateDealWithFormData(this.editingDeal.id, formData).subscribe({
      next: (updatedDeal: DealDto) => {
        this.isLoading = false;
        this.successMessage = 'Deal updated successfully!';
        this.editingDeal = null;
        this.previewImages = [];
        this.imageFiles = [];
        this.refreshDeals();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage =
          error.status === 400
            ? 'Invalid data: ' + (error.error?.message || 'Please check your input and try again.')
            : error.error?.message || 'Failed to update deal. Please try again.';
        console.error('Update deal error:', error);
      }
    });
  }

  deleteDeal(dealId: number): void {
    if (confirm('Are you sure you want to delete this deal?')) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      this.apiService.removeDeal(dealId).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Deal deleted successfully!';
          this.refreshDeals();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to delete deal. Please try again.';
          console.error('Delete deal error:', error);
        }
      });
    }
  }

  logout(): void {
    this.authService.signOut();
    this.router.navigate(['/login']);
  }

  private refreshDeals(): void {
    if (!this.userId) return;

    this.userDeals$ = this.apiService.getDealByUserId(this.userId).pipe(
      map((deals: DealDto[]) => {
        return deals.map(deal => ({
          ...deal,
          image: deal.image
            ? `${this.BASE_URL}${deal.image.split(',').map(img => img.trim())[0]}`
            : `${this.BASE_URL}/images/placeholder.jpg`
        }));
      })
    );
  }

  addNewDeal(): void {
    this.router.navigate(['/createdeal']);
  }
}