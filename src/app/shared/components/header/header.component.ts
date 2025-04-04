import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FilterService } from '../../services/filter.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
   categories = [
    { name: "Beauty & Spas", isOpen: false, subcategories: ["Club Memberships", "Spa & Wellness", "Skincare", "Cosmetic Treatments"] },
    { name: "Things To Do", isOpen: false, subcategories: ["Outdoor & Sports", "Tourist Attractions"] },
    { name: "Food & Drink", isOpen: false, subcategories: ["Travel Packages"] }, // Limited overlap; could expand if needed
    { name: "Auto and Home Services", isOpen: false, subcategories: ["Car Accessories", "Home Appliances", "Furniture", "Kitchenware"] },
    { name: "Gifts", isOpen: false, subcategories: ["Footwear", "Clothing", "Watches & Jewelry", "Bags & Purses"] },
    { name: "Local", isOpen: false, subcategories: ["Gym Memberships", "Smart Home Devices"] }, // Broad interpretation
    { name: "Travel", isOpen: false, subcategories: ["Travel Packages"] },
    { name: "Goods", isOpen: false, subcategories: ["Books & Stationery", "Pet Supplies", "Language Courses", "Online Courses"] },
    { name: "Coupons", isOpen: false, subcategories: ["Electronics", "Fitness Gear"] }, // Broad interpretation
  ];

   locations = [
    { 
      region: "Toshkent Viloyati", // Renamed to clarify it’s the province
      subregions: [
        "Bektemir", "Mirobod", "Mirzo Ulugbek", "Sergeli", "Uchtepa", "Chilonzor",
        "Shayxontohur", "Yashnobod", "Yunusobod", "Olmazor", "Yakkasaroy", "Yangihayot",
        "Angren", "Ohangaron", "Chirchiq", "Yangiyo‘l", "Parkent", "Nurafshon"
      ], 
      expanded: false 
    },
    { 
      region: "Toshkent Shahri", // Separated city from province
      subregions: [
        "Chorsu", "Almazar", "Uchtepa", "Yunusobod", "Chilonzor", "Mirzo Ulugbek",
        "Sergeli", "Shayxontohur", "Yakkasaray", "Mirobod", "Yashnobod"
      ], 
      expanded: false 
    },
    { 
      region: "Sirdaryo", 
      subregions: [
        "Guliston", "Yangiyer", "Shirin", "Boyovut", "Xovos", "Mirzaobod", 
        "Oqoltin", "Sayxunobod", "Sardoba"
      ], 
      expanded: false 
    },
    { 
      region: "Qashqadaryo", 
      subregions: [
        "Qarshi", "Shahrisabz", "G‘uzor", "Kitob", "Koson", "Yakkabog‘", 
        "Muborak", "Kasbi", "Mirishkor", "Nishon", "Dehqonobod", "Chiroqchi"
      ], 
      expanded: false 
    },
    { 
      region: "Andijon", 
      subregions: [
        "Andijon", "Xonabod", "Asaka", "Baliqchi", "Bo‘ston", "Buloqboshi", 
        "Izboskan", "Jalaquduq", "Marhamat", "Oltinko‘l", "Paxtaobod", "Shahrixon", 
        "Ulug‘nor", "Jalalkuduk", "Old Town", "Center"
      ], 
      expanded: false 
    },
    { 
      region: "Buxoro", 
      subregions: [
        "Buxoro", "Kogon", "G‘ijduvon", "Jondor", "Qorako‘l", "Romitan", 
        "Vobkent", "Olot", "Shofirkon", "Peshku", "Lyabi Hauz", "Ark", "Old City"
      ], 
      expanded: false 
    },
    { 
      region: "Farg‘ona", 
      subregions: [
        "Farg‘ona", "Qo‘qon", "Marg‘ilon", "Quva", "Rishton", "Oltiariq", 
        "Beshariq", "Dang‘ara", "Uchko‘prik", "Furqat", "Yozyovon", "O‘zbekiston", 
        "Toshloq", "Kokand", "Margilan"
      ], 
      expanded: false 
    },
    { 
      region: "Jizzax", 
      subregions: [
        "Jizzax", "G‘allaorol", "Do‘stlik", "Zomin", "Paxtakor", "Baxmal", 
        "Forish", "Sharof Rashidov", "Mirzachul", "Arnasoy", "Yangiobod"
      ], 
      expanded: false 
    },
    { 
      region: "Namangan", 
      subregions: [
        "Namangan", "Chortoq", "Chust", "Pop", "Kosonsoy", "To‘raqo‘rg‘on", 
        "Mingbuloq", "Uchqo‘rg‘on", "Yangiqo‘rg‘on", "Norin", "Downtown"
      ], 
      expanded: false 
    },
    { 
      region: "Navoiy", 
      subregions: [
        "Navoiy", "Zarafshon", "Karmana", "Qiziltepa", "Xatirchi", "Nurota", 
        "Konimex", "Tomdi", "Uchquduq"
      ], 
      expanded: false 
    },
    { 
      region: "Samarqand", 
      subregions: [
        "Samarqand", "Kattaqo‘rg‘on", "Urgut", "Bulung‘ur", "Jomboy", "Ishtixon", 
        "Pastdarg‘om", "Nurobod", "Paxtachi", "Qo‘shrabot", "Toyloq", "Registan", 
        "Siab Bazaar", "Gur Emir", "Bibi Khanym"
      ], 
      expanded: false 
    },
    { 
      region: "Surxondaryo", 
      subregions: [
        "Termiz", "Denov", "Sho‘rchi", "Boysun", "Jarqo‘rg‘on", "Qumqo‘rg‘on", 
        "Sherobod", "Angor", "Muzrabot", "Sariosiyo", "Oltinsoy"
      ], 
      expanded: false 
    },
    { 
      region: "Xorazm", 
      subregions: [
        "Urganch", "Xiva", "Gurlan", "Shovot", "Bog‘ot", "Qo‘shko‘pir", 
        "Yangibozor", "Xonqa", "Hazorasp", "Yangiariq", "Tuproqqal‘a", "Ichon Qala"
      ], 
      expanded: false 
    },
    { 
      region: "Qoraqalpog‘iston", 
      subregions: [
        "Nukus", "Mo‘ynoq", "Qo‘ng‘irot", "Beruniy", "Ellikqal‘a", "Xo‘jayli", 
        "Amudaryo", "Chimboy", "To‘rtko‘l", "Kegeyli", "Qanliko‘l", "Shumanay", 
        "Taxtako‘pir"
      ], 
      expanded: false 
    }
  ];

  showAll = false;
  notificationCount: number = 0; // Will be updated dynamically
  showModal: boolean = false;
  notifications: any[] = [];

  selectedRegion: string | null = null;
  selectedSubregions: { [key: string]: string[] } = {};
  selectedSubcategories: string[] = []; // Track selected subcategories
  showDropdown = false;
  searchQuery = "";
  isMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private filterService: FilterService // Inject FilterService
  ) {
    this.locations.forEach(location => {
      this.selectedSubregions[location.region] = [];
    });

    this.loadNotifications(); // Load notifications on component initialization
  }

  // src/app/header.component.ts
  loadNotifications(): void {
    this.apiService.getRecentNotifications(5).subscribe({
      next: (notifications) => {
        this.notifications = notifications; // Each notification now has a full image URL
        this.notificationCount = notifications.length;
      },
      error: (err) => {
        console.error('Error fetching notifications:', err);
        this.notifications = [];
        this.notificationCount = 0;
      },
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
    this.applyFilters(); // Apply filters when subregion changes
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
    this.selectedSubcategories = [];
    this.searchQuery = '';
    this.applyFilters(); // Reset filters
  }

  querySearch(): void {
    this.applyFilters(); // Apply filters when search query changes
    console.log("Searching for:", this.searchQuery);
    console.log("Selected Subregions:", this.selectedSubregions);
    console.log("Selected Subcategories:", this.selectedSubcategories);
  }

  applyFilters(): void {
    // Send filter criteria to FilterService
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
    console.log(`Selected: ${category.name}`);
  }

  selectSubcategoryLarge(categoryName: string, subcategoryName: string, event: Event): void {
    event.stopPropagation();
    this.categories.forEach(cat => (cat.isOpen = false));
    const selectedCategory = this.categories.find(cat => cat.name === categoryName);
    if (selectedCategory) {
      selectedCategory.isOpen = true;
      // Toggle subcategory selection
      if (this.selectedSubcategories.includes(subcategoryName)) {
        this.selectedSubcategories = this.selectedSubcategories.filter(sub => sub !== subcategoryName);
      } else {
        this.selectedSubcategories.push(subcategoryName);
      }
      this.applyFilters(); // Apply filters when subcategory changes
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
    // Toggle subcategory selection
    if (this.selectedSubcategories.includes(subcategoryName)) {
      this.selectedSubcategories = this.selectedSubcategories.filter(sub => sub !== subcategoryName);
    } else {
      this.selectedSubcategories.push(subcategoryName);
    }
    this.applyFilters(); // Apply filters when subcategory changes
    console.log(`Category: ${categoryName}, Subcategory: ${subcategoryName}`);
  }
}