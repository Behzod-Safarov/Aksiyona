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
  image: string; // This will now store the full URL
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
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly BASE_URL = 'http://localhost:5251';
  deals: Deal[] = [];
  filteredDeals: Deal[] = [];
  loading: boolean = false;
  error: string | null = null;
  private countdownIntervals: any[] = [];
  userId: number | null = null;
  private filterSubscriptions: Subscription[] = [];
  pageNumber = 1;
  pageSize = 10;
  hasMoreDeals = true;
  private observer: IntersectionObserver | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.authService.userId$.subscribe(userId => {
      this.userId = userId;
      this.resetAndFetchDeals();
      console.log('userId:', this.userId);
    });

    this.filterSubscriptions.push(
      this.filterService.searchQuery$.subscribe(() => this.applyFilters()),
      this.filterService.selectedCategories$.subscribe(() => this.applyFilters()),
      this.filterService.selectedLocations$.subscribe(() => this.applyFilters())
    );

    this.setupIntersectionObserver();
    this.fetchDeals();
  }

  ngOnDestroy(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
    this.filterSubscriptions.forEach(sub => sub.unsubscribe());
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  resetAndFetchDeals(): void {
    this.pageNumber = 1;
    this.deals = [];
    this.filteredDeals = [];
    this.hasMoreDeals = true;
    this.fetchDeals();
  }

  fetchDeals(): void {
    if (!this.hasMoreDeals || this.loading) {
      console.log('Fetch aborted: No more deals or already loading');
      return;
    }

    this.loading = true;
    console.log(`Fetching deals - Page: ${this.pageNumber}, Size: ${this.pageSize}`);
    this.apiService.getDeals(this.pageNumber, this.pageSize).subscribe({
      next: (deals: DealDto[]) => {
        console.log(`Received ${deals.length} deals for page ${this.pageNumber}`);
        if (deals.length < this.pageSize) {
          this.hasMoreDeals = false;
          console.log('No more deals to load');
        }

        const newDeals = deals.map((deal: DealDto) => {
          const expiryDate = deal.expiryDate ? new Date(deal.expiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
          if (isNaN(expiryDate.getTime())) {
            console.warn(`Invalid ExpiryDate for deal ${deal.id}, using default date`);
            expiryDate.setTime(Date.now() + 24 * 60 * 60 * 1000);
          }
          // Construct full image URL
          const imageUrl = deal.image 
            ? `${this.BASE_URL}${deal.image.split(',').map(img => img.trim())[0]}` 
            : `${this.BASE_URL}/images/placeholder.jpg`;
          console.log(`Mapped image URL for deal ${deal.id}: ${imageUrl}`); // Debug log

          return {
            id: deal.id ?? 0,
            image: imageUrl,
            title: deal.title ?? 'Untitled Deal',
            price: deal.price ?? 0,
            oldPrice: deal.oldPrice ?? 0,
            discount: deal.discount ?? 0,
            rating: deal.rating ?? 0,
            reviews: deal.reviews ?? 0,
            expiryDate: expiryDate,
            timeLeft: '',
            liked: false,
            category: deal.category ?? 'Unknown',
            stock: deal.stock ?? 0,
            likeId: undefined,
            region: deal.region,
            subRegion: deal.subRegion
          } as Deal;
        }).filter((deal: Deal) => !isNaN(deal.expiryDate.getTime()));

        this.deals = [...this.deals, ...newDeals];
        console.log(`Total deals after fetch: ${this.deals.length}`);

        if (this.userId) {
          this.apiService.getUserLikedDeals(this.userId).subscribe({
            next: (likedDeals: LikedDto[]) => {
              this.deals = this.deals.map((deal: Deal) => {
                const likedDeal = likedDeals.find(liked => liked.dealId === deal.id);
                return {
                  ...deal,
                  liked: !!likedDeal,
                  likeId: likedDeal?.Id
                };
              });
              this.startCountdowns();
              this.applyFilters();
              this.loading = false;
            },
            error: (err) => {
              console.error("Error fetching liked deals:", err);
              this.error = "Failed to load liked deals.";
              this.startCountdowns();
              this.applyFilters();
              this.loading = false;
            }
          });
        } else {
          this.startCountdowns();
          this.applyFilters();
          this.loading = false;
        }
      },
      error: (err) => {
        console.error("Error fetching deals:", err);
        this.error = "Failed to load deals.";
        this.loading = false;
      }
    });
  }

  setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMoreDeals && !this.loading) {
          console.log('Sentinel intersected - Loading next page');
          this.pageNumber++;
          this.fetchDeals();
        }
      });
    }, {
      root: null,
      threshold: 0.1
    });

    setTimeout(() => {
      const sentinel = document.querySelector('#sentinel');
      if (sentinel) {
        this.observer!.observe(sentinel);
        console.log('Observer attached to sentinel');
      } else {
        console.warn('Sentinel not found in DOM');
      }
    }, 100);
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
    }).unsubscribe();

    // Filter by selected categories
    this.filterService.selectedCategories$.subscribe(categories => {
      if (categories.length > 0) {
        filtered = filtered.filter(deal =>
          categories.some(cat => deal.category.toLowerCase().includes(cat.toLowerCase()))
        );
      }
    }).unsubscribe();

    // Filter by selected locations
    this.filterService.selectedLocations$.subscribe(locations => {
      const selectedRegions = Object.values(locations).flat();
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
    this.startCountdowns();
  }

  startCountdowns(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
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
      this.countdownIntervals[index] = setInterval(updateTimer, 60000);
    });
  }

  openDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggleLike(event: Event, index: number): void {
    event.stopPropagation();

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const deal = this.filteredDeals[index];
    const wasLiked = deal.liked;
    deal.liked = !deal.liked;

    if (deal.liked) {
      this.apiService.addLike({ userId: this.userId, dealId: deal.id }).subscribe({
        next: (likedDto: LikedDto) => {
          deal.likeId = likedDto.Id;
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
      if (deal.likeId) {
        this.apiService.removeLike(deal.likeId).subscribe({
          next: () => {
            deal.likeId = undefined;
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