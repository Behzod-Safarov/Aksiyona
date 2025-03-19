import { Component, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Import qilish shart
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true, // ✅ Standalone qilish
  imports: [CommonModule, FormsModule], 
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

  locations = [
    { region: "Illinois", subregions: ["Chicago", "Elgin", "Lisle", "Downers Grove", "Lemont","2"], expanded: false },
    { region: "Ohio", subregions: ["Cincinnati"], expanded: false },
    { region: "Uzb", subregions: ["anaqa"], expanded: false },
  ];
  showAll = false;
  notificationCount: number = 4;
  showModal: boolean = false; // Controls modal visibility

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
  constructor(private router: Router) {
    // Initialize selectedSubregions object
    this.locations.forEach(location => {
      this.selectedSubregions[location.region] = [];
    });
  }

  toggleNotificationModal() {
    this.showModal = !this.showModal;
  }

  onCartClick() {
    console.log('Cart icon clicked!');
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    
    if (this.showDropdown) {
      this.selectedSubregions = { ...this.selectedSubregions }; // Ensure a new reference
    }
  }
  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }


  closeRegionsMenu() {
    this.showDropdown = false;
  }
  
  hertIconClicked() {
    console.log("Heart icon clicked");
  }
  // Select/deselect subregions and log the selection
  selectSubregion(region: string, subregion: string) {
    if (!this.selectedSubregions[region]) {
      this.selectedSubregions[region] = []; // Ensure array exists before accessing it
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

    // Truncate if the length exceeds 40 characters
    return result.length > 40 ? result.substring(0, 30) + "..." : result;
  }


  // Check if a subregion is selected
  isSubregionSelected(region: string, subregion: string): boolean {
    return this.selectedSubregions[region]?.includes(subregion);
  }

  toggleLocation(selectedLocation: any) {
    this.locations.forEach((location: any) => {
      if (location !== selectedLocation) {
        location.expanded = false; // Close all others
      }
    });
  
    selectedLocation.expanded = !selectedLocation.expanded; 
  }
  
  clearSelection() {
    this.selectedSubregions = {};
    this.searchQuery = ''; 
  }
  
  // Perform search action
  querySearch() {
    console.log("Searching for:", this.searchQuery);

    console.log(this.selectedSubregions)
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
  
  goToHome() {
    this.router.navigate(['/']);
  }
  openNotification(notificationId: number) {
    this.router.navigate(['/deal', notificationId]);
    // Close the modal
    this.showModal = false;
  }
  
  toggleShowAll() {
    this.showAll = true; 
  }
  
  toggleSubcategory(selectedCategory: any) {
    this.categories.forEach(category => {
      if (category === selectedCategory) {
        category.isOpen = !category.isOpen; 
      } else {
        category.isOpen = false;
      }
    });
  }

  selectSubcategory(categoryName: string, subcategoryName: string, event: Event) {
    event.stopPropagation();
    console.log(`Category: ${categoryName}, Subcategory: ${subcategoryName}`);
  }  
  
}
