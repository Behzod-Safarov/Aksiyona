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
import { API_URLS } from '../../../core/constants/api_urls';

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
  categories: { name: string; isOpen: boolean; subcategories: SubcategoryDto[] }[] = [];
  previewImages: string[] = [];
  imageFiles: File[] = [];
  imagesToKeep: string[] = [];
  maxImages = 4;
  public BASE_URL = API_URLS.BASE_URL; // Centralized constant

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
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
              image: deal.image || ''
            }));
          })
        );
      })
    );
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      localStorage.setItem('redirectUrl', this.router.url);
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
    localStorage.setItem('isHeaderVisible', 'false'); // Set header visibility to true
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
    console.log('Editing deal:', deal);
    console.log('Deal image string:', deal.image);

    if (deal.image && deal.image.trim()) {
      const imagePaths = deal.image.split(',').map(img => img.trim()).filter(img => img);
      this.imagesToKeep = [...imagePaths];
      this.previewImages = imagePaths.map(img => `${this.BASE_URL}${img}`);
    } else {
      this.imagesToKeep = [];
      this.previewImages = [];
    }

    this.imageFiles = [];
    this.errorMessage = null;
    this.successMessage = null;

    console.log('Images to keep:', this.imagesToKeep);
    console.log('Preview images:', this.previewImages);
  }

  cancelEditing(): void {
    this.editingDeal = null;
    this.previewImages = [];
    this.imageFiles = [];
    this.imagesToKeep = [];
    this.errorMessage = null;
    this.successMessage = null;
  }

  onImageUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const totalImages = this.imagesToKeep.length + this.imageFiles.length + files.length;
      if (totalImages > this.maxImages) {
        this.errorMessage = `Maximum ${this.maxImages} images allowed. You can only add ${this.maxImages - (this.imagesToKeep.length + this.imageFiles.length)} more images.`;
        return;
      }

      Array.from(files).forEach(file => {
        this.imageFiles.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          this.previewImages.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    const imageUrl = this.previewImages[index];
    if (imageUrl.startsWith(this.BASE_URL)) {
      const imagePath = imageUrl.replace(this.BASE_URL, '');
      const keepIndex = this.imagesToKeep.indexOf(imagePath);
      if (keepIndex !== -1) {
        this.imagesToKeep.splice(keepIndex, 1);
      }
    } else {
      const fileIndex = this.previewImages.length - this.imageFiles.length + index - this.imagesToKeep.length;
      if (fileIndex >= 0 && fileIndex < this.imageFiles.length) {
        this.imageFiles.splice(fileIndex, 1);
      }
    }
    this.previewImages.splice(index, 1);
    this.errorMessage = null;
  }

  onImageError(event: Event, imageUrl: string): void {
    console.error(`Failed to load image: ${imageUrl}`);
    (event.target as HTMLImageElement).src = `${this.BASE_URL}/images/placeholder.jpg`;
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
    formData.append('Id', this.editingDeal.id.toString());
    formData.append('Title', this.editingDeal.title);
    formData.append('Price', this.editingDeal.price.toString());
    formData.append('OldPrice', this.editingDeal.oldPrice?.toString() || '0');
    formData.append('Discount', this.editingDeal.discount.toString());
    formData.append('Rating', this.editingDeal.rating.toString());
    formData.append('Reviews', this.editingDeal.reviews.toString());
    formData.append('ExpiryDate', new Date(this.editingDeal.expiryDate).toISOString());
    formData.append('Liked', this.editingDeal.liked.toString());
    formData.append('SubcategoryId', this.editingDeal.subcategoryId.toString());
    formData.append('Stock', this.editingDeal.stock?.toString() || '100');
    formData.append('CreatedAt', new Date(this.editingDeal.createdAt).toISOString());
    formData.append('DealStartingDate', new Date(this.editingDeal.dealStartingDate).toISOString());
    formData.append('Location', this.editingDeal.location || '');
    formData.append('UserId', this.userId.toString());

    this.imagesToKeep.forEach((imagePath, index) => {
      formData.append(`ImagesToKeep[${index}]`, imagePath);
    });

    this.imageFiles.forEach((file) => {
      formData.append('ImagesToAdd', file, file.name);
    });

    console.log('Sending FormData for update:');
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
        this.imagesToKeep = [];
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
          image: deal.image || ''
        }));
      })
    );
  }

  addNewDeal(): void {
    this.router.navigate(['/createdeal']);
  }
}