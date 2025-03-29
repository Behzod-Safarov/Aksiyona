import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LikedDto } from '../../core/models/liked-dto';
import { DealDto } from '../../core/models/deal-dto';
import { Subscription } from 'rxjs';
import { FilterService } from '../../shared/services/filter.service';

interface Deal {
  id: number;
  image: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  expiryDate: Date;
  timeLeft: string;
  liked: boolean;
  category: string;
  stock: number;
  likeId?: number;
  region?: string;
  subRegion?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  deals: Deal[] = []; // Original list of all deals
  filteredDeals: Deal[] = []; // Filtered list to display
  loading: boolean = true;
  error: string | null = null;
  private countdownIntervals: any[] = [];
  userId: number | null = null;
  private filterSubscriptions: Subscription[] = []; // To manage filter subscriptions

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private filterService: FilterService // Inject FilterService
  ) {}

  ngOnInit(): void {
    // Subscribe to userId changes from AuthService
    this.authService.userId$.subscribe(userId => {
      this.userId = userId;
      this.fetchDeals();
      console.log('userId:', this.userId);
    });

    // Subscribe to filter changes from FilterService
    this.filterSubscriptions.push(
      this.filterService.searchQuery$.subscribe(() => this.applyFilters()),
      this.filterService.selectedCategories$.subscribe(() => this.applyFilters()),
      this.filterService.selectedLocations$.subscribe(() => this.applyFilters())
    );
  }

  ngOnDestroy(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
    this.filterSubscriptions.forEach(sub => sub.unsubscribe()); // Clean up filter subscriptions
  }

  fetchDeals(): void {
    this.loading = true;
    this.error = null;
    this.apiService.getDeals().subscribe({
      next: (deals: DealDto[]) => {
        this.deals = deals.map((deal: DealDto) => {
          const expiryDate = deal.expiryDate ? new Date(deal.expiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 1 day from now
          if (isNaN(expiryDate.getTime())) {
            console.warn(`Invalid ExpiryDate for deal ${deal.id}, using default date`);
            expiryDate.setTime(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
          }
          return {
            id: deal.id ?? 0,
            image: deal.image ?? 'placeholder.jpg',
            title: deal.title ?? 'Untitled Deal',
            price: deal.price ?? 0,
            oldPrice: deal.oldPrice ?? 0,
            discount: deal.discount ?? 0,
            rating: deal.rating ?? 0,
            reviews: deal.reviews ?? 0,
            expiryDate: expiryDate,
            timeLeft: '',
            liked: false, // Will be set after fetching liked deals
            category: deal.category ?? 'Unknown',
            stock: deal.stock ?? 0,
            likeId: undefined,
            region: deal.region,
            subRegion: deal.subRegion
          } as Deal;
        }).filter((deal: Deal) => !isNaN(deal.expiryDate.getTime()));

        // Fetch user’s liked deals to set the liked state (only if logged in)
        if (this.userId) {
          this.apiService.getUserLikedDeals(this.userId).subscribe({
            next: (likedDeals: LikedDto[]) => {
              console.log('Raw likedDeals from API:', likedDeals);
              this.deals = this.deals.map((deal: Deal) => {
                const likedDeal = likedDeals.find(liked => liked.dealId === deal.id);
                console.log(`Deal ${deal.id} - likedDeal:`, likedDeal);
                const updatedDeal = {
                  ...deal,
                  liked: !!likedDeal,
                  likeId: likedDeal?.Id
                };
                console.log('Updated deal:', updatedDeal);
                return updatedDeal;
              });
              this.startCountdowns();
              this.applyFilters(); // Apply filters after fetching
              this.loading = false;
              console.log('Final deals array:', this.deals);
            },
            error: (err) => {
              console.error("Error fetching liked deals:", err);
              this.error = "Failed to load liked deals. Some features may not work as expected.";
              this.startCountdowns();
              this.applyFilters();
              this.loading = false;
            }
          });
        } else {
          this.startCountdowns();
          this.applyFilters();
          this.loading = false;
          console.log("Deals fetched from API (no user logged in):", this.deals);
        }
      },
      error: (err) => {
        console.error("Error fetching deals:", err);
        this.error = "Failed to load deals. Please try again later.";
        this.deals = [];
        this.filteredDeals = [];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.deals];
  
    // Filter by search query
    this.filterService.searchQuery$.subscribe(query => {
      if (query) {
        filtered = filtered.filter(deal =>
          deal.title.toLowerCase().includes(query.toLowerCase()) ||
          deal.category.toLowerCase().includes(query.toLowerCase()) ||
          (deal.region && deal.region.toLowerCase().includes(query.toLowerCase())) ||
          (deal.subRegion && deal.subRegion.toLowerCase().includes(query.toLowerCase()))
        );
      }
    }).unsubscribe(); // Unsubscribe immediately after getting the current value
  
    // Filter by selected categories
    this.filterService.selectedCategories$.subscribe(categories => {
      if (categories.length > 0) {
        filtered = filtered.filter(deal =>
          categories.some(cat => deal.category.toLowerCase().includes(cat.toLowerCase()))
        );
      }
    }).unsubscribe();
  
    // Filter by selected locations (using region and subRegion fields)
    this.filterService.selectedLocations$.subscribe(locations => {
      const selectedRegions = Object.values(locations).flat(); // Flatten regions and subregions
      if (selectedRegions.length > 0) {
        filtered = filtered.filter(deal =>
          selectedRegions.some(loc =>
            (deal.region && deal.region.toLowerCase() === loc.toLowerCase()) ||
            (deal.subRegion && deal.subRegion.toLowerCase() === loc.toLowerCase())
          )
        );
      }
    }).unsubscribe();
  
    this.filteredDeals = filtered;
    this.startCountdowns(); // Restart countdowns for filtered deals
  }

  startCountdowns(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval)); // Clear existing intervals
    this.countdownIntervals = [];
    this.filteredDeals.forEach((deal, index) => {
      const updateTimer = () => {
        const now = new Date();
        const timeDiff = deal.expiryDate.getTime() - now.getTime();
        if (isNaN(timeDiff) || timeDiff <= 0) {
          this.filteredDeals[index].timeLeft = 'Expired';
          clearInterval(this.countdownIntervals[index]);
          return;
        }
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        this.filteredDeals[index].timeLeft = `${days}d ${hours}h ${minutes}m`;
      };
      updateTimer();
      this.countdownIntervals[index] = setInterval(updateTimer, 60000); // Update every minute
    });
  }

  openDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggleLike(event: Event, index: number): void {
    event.stopPropagation();

    // Check if user is authenticated
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const deal = this.filteredDeals[index];
    const wasLiked = deal.liked;
    deal.liked = !deal.liked;

    if (deal.liked) {
      // Add a like
      this.apiService.addLike({ userId: this.userId, dealId: deal.id }).subscribe({
        next: (likedDto: LikedDto) => {
          deal.likeId = likedDto.Id;
          // Sync with original deals array
          this.deals = this.deals.map(d => (d.id === deal.id ? { ...deal } : d));
          console.log(`Deal ${deal.id} liked by user ${this.userId}`);
        },
        error: (err) => {
          console.error(`Error liking deal ${deal.id}:`, err);
          deal.liked = wasLiked;
          this.error = 'Failed to like the deal. Please try again.';
        }
      });
    } else {
      // Remove a like
      if (deal.likeId) {
        this.apiService.removeLike(deal.likeId).subscribe({
          next: () => {
            deal.likeId = undefined;
            // Sync with original deals array
            this.deals = this.deals.map(d => (d.id === deal.id ? { ...deal } : d));
            console.log(`Like removed for deal ${deal.id} by user ${this.userId}`);
          },
          error: (err) => {
            console.error(`Error unliking deal ${deal.id}:`, err);
            deal.liked = wasLiked;
            this.error = 'Failed to unlike the deal. Please try again.';
          }
        });
      }
    }
  }

  trackByDealId(index: number, deal: Deal): number {
    return deal.id;
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }
}