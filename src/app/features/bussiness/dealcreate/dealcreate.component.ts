import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DealDto } from '../../../core/models/deal-dto';
import { Router } from '@angular/router';
import { SubcategoryDto } from '../../../core/models/sub-category-dto';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dealcreate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealcreate.component.html',
  styleUrl: './dealcreate.component.scss'
})
export class DealcreateComponent implements OnInit {
  categories: { name: string; isOpen: boolean; subcategories: SubcategoryDto[] }[] = [];
  locations: { region: string; subregions: string[]; enhanced: boolean }[] = [];

  currentStep: 'location' | 'category' | 'deal' | 'confirmation' | 'success' = 'location';
  selectedLocation: { region?: string; subRegion?: string; isOnline: boolean } = { isOnline: false };
  selectedCategory: { name: string; subcategory: string; subcategoryId: number } = { name: '', subcategory: '', subcategoryId: 0 };
  deal: DealDto & { userId?: number } = {
    id: 0,
    image: '',
    title: '',
    price: 0,
    oldPrice: 0,
    discount: 0,
    rating: 0,
    reviews: 0,
    expiryDate: '',
    liked: false,
    subcategoryId: 0,
    category: '',
    createdAt: new Date().toISOString(),
    dealStartingDate: new Date().toISOString(),
    comments: [],
    notifications: [],
    location: '',
    userId: undefined
  };

  showSubregions: string | null = null;
  previewImages: string[] = [];
  imageFiles: File[] = [];
  maxImages = 4;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: number | null = null;

  // New properties for specific validation errors
  dateValidationError: string | null = null;
  priceValidationError: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.userId$.subscribe({
      next: (userId) => {
        if (!userId) {
          localStorage.setItem('redirectUrl', this.router.url);
          this.errorMessage = 'You must be logged in to create a deal';
          this.router.navigate(['/login']);
          return;
        }
        this.userId = userId;
        this.deal.userId = userId;
        this.loadCategories();
        this.loadLocations();
      },
      error: (error) => {
        console.error('Error getting user ID:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  todayDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum is tomorrow
    return today.toISOString().split('T')[0];
  }

  minExpiryDate(): string {
    if (this.deal.dealStartingDate) {
      const startDate = new Date(this.deal.dealStartingDate);
      startDate.setDate(startDate.getDate() + 1); // Minimum expiry is day after start date
      return startDate.toISOString().split('T')[0];
    }
    return this.todayDate();
  }

  validateDates(): boolean {
    this.dateValidationError = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const startDate = this.deal.dealStartingDate ? new Date(this.deal.dealStartingDate) : null;
    const expiryDate = this.deal.expiryDate ? new Date(this.deal.expiryDate) : null;

    if (startDate && startDate <= today) {
      this.dateValidationError = 'Boshlanish sanasi bugungi kunga yoki undan keyin bo\'lishi kerak.';
      return false;
    }

    if (startDate && expiryDate && expiryDate <= startDate) {
      this.dateValidationError = 'Tugash muddat boshlanish muddatidan keyin bo\'lishi kerak.';
      return false;
    }

    return true;
  }

  validatePrices(): boolean {
    this.priceValidationError = null;
    if (this.deal.oldPrice <= this.deal.price) {
      this.priceValidationError = 'Eski narx yangi narxdan katta bo\'lishi kerak.';
      return false;
    }
    if (this.deal.price <= 0 || this.deal.oldPrice <= 0) {
      this.priceValidationError = 'narxlar 0 dan katta bo\'lishi kerak.';
      return false;
    }
    return true;
  }
  calculateDiscount() {
    if (this.validatePrices()) {
      this.deal.discount = Math.round(((this.deal.oldPrice - this.deal.price) / this.deal.oldPrice) * 100);
    } else {
      this.deal.discount = 0; // Reset discount if prices are invalid
    }
  }

  goToConfirmation() {
    this.errorMessage = null;
    if (!this.deal.title || !this.deal.price || !this.deal.oldPrice || !this.deal.expiryDate || !this.deal.dealStartingDate || !this.imageFiles.length) {
      this.errorMessage = 'Iltimos, barcha majburiy maydonlarni to\'ldiring va kamida bitta rasm yuklang.';
      return;
    }
    if (!this.validateDates() || !this.validatePrices()) {
      return;
    }
    this.currentStep = 'confirmation';
  }

  createDeal() {
    if (!this.userId) {
      this.errorMessage = 'You must be logged in to create a deal';
      this.router.navigate(['/login']);
      return;
    }

    if (!this.validateDates() || !this.validatePrices()) {
      this.errorMessage = 'Iltimos, sanalarni va narxlarni tekshiring.';
      return;
    }

    const formData = new FormData();
    formData.append('title', this.deal.title);
    formData.append('price', this.deal.price.toString());
    formData.append('oldPrice', this.deal.oldPrice.toString());
    formData.append('discount', this.deal.discount.toString());
    formData.append('rating', this.deal.rating.toString());
    formData.append('reviews', this.deal.reviews.toString());
    formData.append('expiryDate', this.deal.expiryDate);
    formData.append('liked', this.deal.liked.toString());
    formData.append('subcategoryId', this.deal.subcategoryId.toString());
    formData.append('stock', '100');
    formData.append('createdAt', this.deal.createdAt);
    formData.append('dealStartingDate', this.deal.dealStartingDate);
    formData.append('location', this.deal.location || '');
    formData.append('region', this.selectedLocation.region || '');
    formData.append('subRegion', this.selectedLocation.subRegion || '');
    formData.append('userId', this.userId.toString());

    this.imageFiles.forEach((file) => {
      formData.append('images', file, file.name);
    });

    this.apiService.addDeal(formData).subscribe({
      next: (response) => {
        console.log('Deal created successfully:', response);
        this.successMessage = 'Awwalam bor tashrifingiz uchun tashakkur, sizning joylagan mahsulotingiz yoki xizmatingiz noqonuniy emas ekanligiga adminlarimiz ishonch xosil qilganidan keyin biz uni ommaga namoyish etamiz.';
        this.errorMessage = null;
        this.currentStep = 'success';
      },
      error: (error) => {
        console.error('Error creating deal:', error);
        this.errorMessage = error.error?.message || 'Failed to create deal. Please try again.';
        this.successMessage = null;
      }
    });
  }

  // Existing methods (unchanged unless noted)
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

  loadLocations() {
    this.apiService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations.map(loc => ({
          region: loc.region,
          subregions: loc.subregions,
          enhanced: false
        }));
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.errorMessage = 'Failed to load locations. Please try again.';
      }
    });
  }

  get progressWidth(): string {
    const steps = ['location', 'category', 'deal', 'confirmation'];
    const currentIndex = steps.indexOf(this.currentStep);
    const percentage = this.currentStep === 'success' ? 100 : (currentIndex / (steps.length - 1)) * 100;
    return `${percentage}%`;
  }

  toggleSubregions(region: string) {
    this.showSubregions = this.showSubregions === region ? null : region;
  }

  selectLocation(region: string, subRegion?: string) {
    this.selectedLocation = { region, subRegion, isOnline: false };
    this.currentStep = 'category';
    this.showSubregions = null;
  }

  selectOnlineStore() {
    this.selectedLocation = { isOnline: true };
    this.deal.location = 'Online Store';
    this.currentStep = 'category';
    this.showSubregions = null;
  }

  toggleCategory(category: any) {
    category.isOpen = !category.isOpen;
  }

  selectCategory(category: string, subcategory: string, subcategoryId: number) {
    this.selectedCategory = { name: category, subcategory, subcategoryId };
    this.deal.category = category;
    this.deal.subcategoryId = subcategoryId;
    this.currentStep = 'deal';
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
    this.imageFiles.splice(index, 1);
    this.errorMessage = null;
  }

  goBack() {
    if (this.currentStep === 'category') {
      this.currentStep = 'location';
    } else if (this.currentStep === 'deal') {
      this.currentStep = 'category';
    } else if (this.currentStep === 'confirmation') {
      this.currentStep = 'deal';
    }
  }

  createAnotherDeal() {
    this.resetForm();
    this.currentStep = 'location';
  }

  goToHomePage() {
    this.router.navigate(['cabinet']);
  }

  goToCabinet() {
    this.router.navigate(['/cabinet']);
  }

  resetForm() {
    this.selectedLocation = { isOnline: false };
    this.selectedCategory = { name: '', subcategory: '', subcategoryId: 0 };
    this.deal = {
      id: 0,
      image: '',
      title: '',
      price: 0,
      oldPrice: 0,
      discount: 0,
      rating: 0,
      reviews: 0,
      expiryDate: '',
      liked: false,
      subcategoryId: 0,
      category: '',
      createdAt: new Date().toISOString(),
      dealStartingDate: '',
      comments: [],
      notifications: [],
      location: '',
      userId: this.userId ?? undefined
    };
    this.previewImages = [];
    this.imageFiles = [];
    this.errorMessage = null;
    this.successMessage = null;
    this.dateValidationError = null;
    this.priceValidationError = null;
  }
}