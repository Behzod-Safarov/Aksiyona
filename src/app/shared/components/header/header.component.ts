import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FilterService } from '../../services/filter.service';
import { ApiService } from '../../../services/api.service';
import { SubcategoryDto } from '../../../core/models/sub-category-dto';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  categories: { name: string; isOpen: boolean; subcategories: SubcategoryDto[] }[] = [];
  locations: { region: string; subregions: string[]; expanded: boolean }[] = [];

  showAll = false;
  notificationCount: number = 0;
  showModal: boolean = false;
  notifications: any[] = [];

  selectedRegion: string | null = null;
  selectedSubregions: { [key: string]: string[] } = {};
  selectedSubcategories: string[] = [];
  showDropdown = false;
  searchQuery = "";
  isMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private filterService: FilterService
  ) {
    this.loadCategories();
    this.loadLocations();
    this.loadNotifications();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({
          name: cat.name,
          isOpen: false,
          subcategories: cat.subcategories // Already an array of SubcategoryDto
        }));
        // Initialize selectedSubregions after categories are loaded
        this.categories.forEach(() => {
          this.selectedSubregions = { ...this.selectedSubregions };
        });
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.categories = [];
      }
    });
  }

  loadLocations() {
    this.apiService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations.map(loc => ({
          region: loc.region,
          subregions: loc.subregions,
          expanded: false
        }));
        // Initialize selectedSubregions for each region
        this.locations.forEach(location => {
          this.selectedSubregions[location.region] = [];
        });
      },
      error: (err) => {
        console.error('Error fetching locations:', err);
        this.locations = [];
      }
    });
  }

  loadNotifications(): void {
    this.apiService.getRecentNotifications(5).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.notificationCount = notifications.length;
      },
      error: (err) => {
        console.error('Error fetching notifications:', err);
        this.notifications = [];
        this.notificationCount = 0;
      }
    });
  }

  onSignInClick(): void {
    this.router.navigate(['/createdeal']);
    console.log('Sign in clicked!');
  }

  onSignOutClick(): void {
    this.authService.signOut();
    console.log('Sign out clicked!');
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  toggleNotificationModal(): void {
    this.showModal = !this.showModal;
  }

  onCartClick(): void {
    console.log('Cart icon clicked!');
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.selectedSubregions = { ...this.selectedSubregions };
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  closeRegionsMenu(): void {
    this.showDropdown = false;
  }

  hertIconClicked(): void {
    this.router.navigate(['liked']);
    console.log("Heart icon clicked");
  }

  selectSubregion(region: string, subregion: string): void {
    if (!this.selectedSubregions[region]) {
      this.selectedSubregions[region] = [];
    }
    if (this.selectedSubregions[region].includes(subregion)) {
      this.selectedSubregions[region] = this.selectedSubregions[region].filter(s => s !== subregion);
    } else {
      this.selectedSubregions[region].push(subregion);
    }
    this.applyFilters();
    console.log("Region:", region, "Selected Subregions:", this.selectedSubregions[region]);
  }

  getTruncatedLocation(): string {
    let selections: string[] = [];
    for (let region in this.selectedSubregions) {
      if (this.selectedSubregions[region].length > 0) {
        selections.push(`${region}: ${this.selectedSubregions[region].join(', ')}`);
      }
    }
    let result = selections.length > 0 ? selections.join(" | ") : "Joylashuvni tanlang"; // "Select Location" in Uzbek
    return result.length > 40 ? result.substring(0, 30) + "..." : result;
  }

  isSubregionSelected(region: string, subregion: string): boolean {
    return this.selectedSubregions[region]?.includes(subregion) || false;
  }

  toggleLocation(selectedLocation: any): void {
    this.locations.forEach((location: any) => {
      if (location !== selectedLocation) {
        location.expanded = false;
      }
    });
    selectedLocation.expanded = !selectedLocation.expanded;
  }

  clearSelection(): void {
    this.selectedSubregions = {};
    this.selectedSubcategories = [];
    this.searchQuery = '';
    this.locations.forEach(location => {
      this.selectedSubregions[location.region] = [];
    });
    this.applyFilters();
  }

  querySearch(): void {
    this.applyFilters();
    console.log("Qidiruv:", this.searchQuery); // "Search" in Uzbek
    console.log("Tanlangan hududlar:", this.selectedSubregions); // "Selected regions" in Uzbek
    console.log("Tanlangan subkategoriyalar:", this.selectedSubcategories); // "Selected subcategories" in Uzbek
  }

  applyFilters(): void {
    this.filterService.setSearchQuery(this.searchQuery);
    this.filterService.setSelectedCategories(this.selectedSubcategories);
    this.filterService.setSelectedLocations(this.selectedSubregions);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.isMenuOpen = false;
    }
  }

  toggleSubcategoryLarge(category: any): void {
    this.categories.forEach(cat => {
      if (cat !== category) cat.isOpen = false;
    });
    category.isOpen = !category.isOpen;
    console.log(`Tanlandi: ${category.name}`); // "Selected" in Uzbek
  }

  selectSubcategoryLarge(categoryName: string, subcategoryName: string, event: Event): void {
    event.stopPropagation();
    this.categories.forEach(cat => (cat.isOpen = false));
    const selectedCategory = this.categories.find(cat => cat.name === categoryName);
    if (selectedCategory) {
      selectedCategory.isOpen = true;
      if (this.selectedSubcategories.includes(subcategoryName)) {
        this.selectedSubcategories = this.selectedSubcategories.filter(sub => sub !== subcategoryName);
      } else {
        this.selectedSubcategories.push(subcategoryName);
      }
      this.applyFilters();
      console.log(`Tanlandi: ${categoryName} -> ${subcategoryName}`);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  openNotification(notificationId: number): void {
    this.router.navigate(['/deal', notificationId]);
    this.showModal = false;
  }

  toggleShowAll(): void {
    this.showAll = true;
  }

  toggleSubcategory(selectedCategory: any): void {
    this.categories.forEach(category => {
      if (category === selectedCategory) {
        category.isOpen = !category.isOpen;
      } else {
        category.isOpen = false;
      }
    });
  }

  selectSubcategory(categoryName: string, subcategoryName: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedSubcategories.includes(subcategoryName)) {
      this.selectedSubcategories = this.selectedSubcategories.filter(sub => sub !== subcategoryName);
    } else {
      this.selectedSubcategories.push(subcategoryName);
    }
    this.applyFilters();
    console.log(`Kategoriya: ${categoryName}, Subkategoriya: ${subcategoryName}`);
  }

  goToCreateDeal(): void {
    this.router.navigate(['/createdeal']);
  }
}