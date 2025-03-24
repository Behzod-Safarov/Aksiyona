import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  categories = [
    { name: 'Beauty & Spas', icon: '📍', isOpen: false, subcategories: ['Restaurants', 'Shops', 'Events'] },
    { name: 'Things To Do', icon: '🎁', isOpen: false, subcategories: ['Flowers', 'Toys', 'Accessories'] },
    { name: 'Food & Drink', icon: '✈️', isOpen: false, subcategories: ['Hotels', 'Flights', 'Tour Packages'] },
    { name: 'Auto and Home Services', icon: '✈️', isOpen: false, subcategories: ['Hotels', 'Flights', 'Tour Packages'] },
    { name: 'Gifts', icon: '🛍️', isOpen: false, subcategories: ['Electronics', 'Clothing', 'Home Appliances'] },
    { name: 'Local', icon: '🎟️', isOpen: false, subcategories: ['Food Discounts', 'Tech Deals', 'Clothing Offers'] },
    { name: 'Travel', icon: '💄', isOpen: false, subcategories: ['Makeup', 'Skincare', 'Haircare'] },
    { name: 'Goods', icon: '🛠️', isOpen: false, subcategories: ['Home Repairs', 'Cleaning', 'Moving'] },
    { name: 'Coupons', icon: '🎭', isOpen: false, subcategories: ['Movies', 'Concerts', 'Sports'] }
  ];

  locations = [
    { region: "Illinois", subregions: ["Chicago", "Elgin", "Lisle", "Downers Grove", "Lemont", "2"], expanded: false },
    { region: "Ohio", subregions: ["Cincinnati"], expanded: false },
    { region: "Uzb", subregions: ["anaqa"], expanded: false },
  ];

  showAll = false;
  notificationCount: number = 4;
  showModal: boolean = false;
  notifications = [
    { id: 1, title: 'Deal of the Day', description: 'Limited-time offer!', time: '21 hours ago', image: 'deal_of_the_day.jpg' },
    { id: 2, title: 'Flash Sale!', description: 'Huge discounts on electronics!', time: '12 hours ago', image: 'flash_sale.jpg' },
    { id: 3, title: 'New Arrival', description: 'Check out our latest collection.', time: '8 hours ago', image: 'new_arrival.jpg' },
    { id: 4, title: 'Exclusive Offer', description: 'Special deals just for you.', time: '5 hours ago', image: 'exclusive_offer.jpg' },
    { id: 5, title: 'Weekend Sale', description: 'Best prices this weekend!', time: '2 hours ago', image: 'weekend_sale.jpg' }
  ];

  selectedRegion: string | null = null;
  selectedSubregions: { [key: string]: string[] } = {};
  showDropdown = false;
  searchQuery = "";
  isMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    this.locations.forEach(location => {
      this.selectedSubregions[location.region] = [];
    });
  }

  onSignInClick(): void {
    this.router.navigate(['/login']);
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
    console.log("Region:", region, "Selected Subregions:", this.selectedSubregions[region]);
  }

  getTruncatedLocation(): string {
    let selections: string[] = [];
    for (let region in this.selectedSubregions) {
      if (this.selectedSubregions[region].length > 0) {
        selections.push(`${region}: ${this.selectedSubregions[region].join(', ')}`);
      }
    }
    let result = selections.length > 0 ? selections.join(" | ") : "Select Location";
    return result.length > 40 ? result.substring(0, 30) + "..." : result;
  }

  isSubregionSelected(region: string, subregion: string): boolean {
    return this.selectedSubregions[region]?.includes(subregion);
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
    this.searchQuery = '';
  }

  querySearch(): void {
    console.log("Searching for: ", this.searchQuery);
    console.log(this.selectedSubregions);
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
    console.log(`Selected: ${category.name}`);
  }

  selectSubcategoryLarge(categoryName: string, subcategoryName: string, event: Event): void {
    event.stopPropagation();
    this.categories.forEach(cat => (cat.isOpen = false));
    const selectedCategory = this.categories.find(cat => cat.name === categoryName);
    if (selectedCategory) {
      selectedCategory.isOpen = true;
      console.log(`Selected: ${categoryName} -> ${subcategoryName}`);
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
    console.log(`Category: ${categoryName}, Subcategory: ${subcategoryName}`);
  }
}