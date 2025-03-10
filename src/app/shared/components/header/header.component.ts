import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Import qilish shart
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true, // ✅ Standalone qilish
  imports: [CommonModule, FormsModule], // ✅ CommonModule ni qo‘shish
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  categories = [
    {
      name: 'Beauty & Spas',
      icon: '📍',
      isOpen: false,
      subcategories: ['Restaurants', 'Shops', 'Events']
    },
    {
      name: 'Things To Do',
      icon: '🎁',
      isOpen: false,
      subcategories: ['Flowers', 'Toys', 'Accessories']
    },
    {
      name: 'Food & Drink',
      icon: '✈️',
      isOpen: false,
      subcategories: ['Hotels', 'Flights', 'Tour Packages']
    },
    {
      name: 'Auto and Home Services',
      icon: '✈️',
      isOpen: false,
      subcategories: ['Hotels', 'Flights', 'Tour Packages']
    },
    {
      name: 'Gifts',
      icon: '🛍️',
      isOpen: false,
      subcategories: ['Electronics', 'Clothing', 'Home Appliances']
    },
    {
      name: 'Local',
      icon: '🎟️',
      isOpen: false,
      subcategories: ['Food Discounts', 'Tech Deals', 'Clothing Offers']
    },
    {
      name: 'Travel',
      icon: '💄',
      isOpen: false,
      subcategories: ['Makeup', 'Skincare', 'Haircare']
    },
    {
      name: 'Goods',
      icon: '🛠️',
      isOpen: false,
      subcategories: ['Home Repairs', 'Cleaning', 'Moving']
    },
    {
      name: 'Coupons',
      icon: '🎭',
      isOpen: false,
      subcategories: ['Movies', 'Concerts', 'Sports']
    }
  ];

  showDropdown = false;
  selectedLocation: string | null = null;
  searchQuery = '';
  locations = [
    "Uzbek American Association of Chicago, Van Street, Elgin",
    "UZB TRANS, INC, New Avenue, Lemont",
    "Uzbegim - Halal Market, Royal Point Drive, Cincinnati",
    "Uzbek Inc, Main Street, Lisle",
    "ANJIR UZBEK HALAL CUISINE, Butterfield Road, Downers Grove"
  ];

  filteredLocations = [...this.locations];

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  filterLocations() {
    this.filteredLocations = this.locations.filter(loc =>
      loc.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  selectLocation(location: string) {
    this.selectedLocation = location;
    this.showDropdown = false;
  }

  setCurrentLocation() {
    this.selectedLocation = "Current Location";
    this.showDropdown = false;
  }

  search(query: string) {
    this.searchQuery = query;
    console.log(`Searching for: ${this.searchQuery}`);
  }
  
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(event: Event) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.isMenuOpen = false;
    }
  }

  toggleSubcategoryLarge(category: any) {
    this.categories.forEach(cat => {
      if (cat !== category) cat.isOpen = false;
    });
    category.isOpen = !category.isOpen;
    console.log(`Selected: ${category.name}`);
  }
  
  selectSubcategoryLarge(categoryName: string, subcategoryName: string, event: Event) {
    event.stopPropagation();
  
    // Close all categories first
    this.categories.forEach(cat => (cat.isOpen = false));
  
    // Find the selected category and open it
    const selectedCategory = this.categories.find(cat => cat.name === categoryName);
    if (selectedCategory) {
      selectedCategory.isOpen = true;
      console.log(`Selected: ${categoryName} -> ${subcategoryName}`);
    }
  }
  
  
  toggleSubcategory(selectedCategory: any) {
    this.categories.forEach(category => {
      if (category === selectedCategory) {
        category.isOpen = !category.isOpen; // Toggle selected category
      } else {
        category.isOpen = false; // Close others
      }
    });
  }
  selectSubcategory(categoryName: string, subcategoryName: string, event: Event) {
    event.stopPropagation(); // Prevents parent click event from firing
    console.log(`Category: ${categoryName}, Subcategory: ${subcategoryName}`);
    // You can now handle selection (e.g., navigate, apply filters, etc.)
  }  
  
}
