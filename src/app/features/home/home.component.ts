import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LikedDto } from '../../core/models/liked-dto';
import { DealDto } from '../../core/models/deal-dto';


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
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  deals: Deal[] = [];
  loading: boolean = true;
  error: string | null = null;
  private countdownIntervals: any[] = [];
  userId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Subscribe to userId changes from AuthService
    this.authService.userId$.subscribe(userId => {
      this.userId = userId;

      this.fetchDeals();
      console.log('userId:', this.userId)
    });
  }

  ngOnDestroy(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
  }

  fetchDeals(): void {
    this.loading = true;
    this.error = null;
    this.apiService.getDeals().subscribe({
      next: (deals: DealDto[]) => {
        this.deals = deals.map((deal: DealDto) => {
          const expiryDate = deal.ExpiryDate ? new Date(deal.ExpiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 1 day from now
          if (isNaN(expiryDate.getTime())) {
            console.warn(`Invalid ExpiryDate for deal ${deal.Id}, using default date`);
            expiryDate.setTime(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
          }
          return {
            id: deal.Id ?? 0,
            image: deal.Image ?? 'placeholder.jpg',
            title: deal.Title ?? 'Untitled Deal',
            price: deal.Price ?? 0,
            oldPrice: deal.OldPrice ?? 0,
            discount: deal.Discount ?? 0,
            rating: deal.Rating ?? 0,
            reviews: deal.Reviews ?? 0,
            expiryDate: expiryDate,
            timeLeft: '',
            liked: false, // Will be set after fetching liked deals
            category: deal.Category ?? 'Unknown',
            stock: deal.Stock ?? 0,
            likeId: undefined
          } as Deal;
        }).filter((deal: Deal) => !isNaN(deal.expiryDate.getTime()));
  
        // Fetch user’s liked deals to set the liked state (only if logged in)
        if (this.userId) {
          this.apiService.getUserLikedDeals(this.userId).subscribe({
            next: (likedDeals: LikedDto[]) => {
              console.log('Raw likedDeals from API:', likedDeals); // Log the raw response
        
              this.deals = this.deals.map((deal: Deal) => {
                const likedDeal = likedDeals.find(liked => liked.dealId === deal.id); // Fix property name
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
              this.loading = false;
              console.log('Final deals array:', this.deals);
            },
            error: (err) => {
              console.error("Error fetching liked deals:", err);
              this.error = "Failed to load liked deals. Some features may not work as expected.";
              this.startCountdowns();
              this.loading = false;
            }
          });
        } else {
          this.startCountdowns();
          this.loading = false;
          console.log("Deals fetched from API (no user logged in):", this.deals);
        }
      },
      error: (err) => {
        console.error("Error fetching deals:", err);
        this.error = "Failed to load deals. Please try again later.";
        this.deals = [];
        this.loading = false;
      }
    });
  }

  startCountdowns(): void {
    this.deals.forEach((deal, index) => {
      const updateTimer = () => {
        const now = new Date();
        const timeDiff = deal.expiryDate.getTime() - now.getTime();
        if (isNaN(timeDiff) || timeDiff <= 0) {
          this.deals[index].timeLeft = 'Expired';
          clearInterval(this.countdownIntervals[index]);
          return;
        }
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        this.deals[index].timeLeft = `${days}d ${hours}h ${minutes}m`;
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

    // Check if user is authenticated
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const deal = this.deals[index];
    const wasLiked = deal.liked;
    deal.liked = !deal.liked;

    if (deal.liked) {
      // Add a like
      this.apiService.addLike({ userId: this.userId, dealId: deal.id }).subscribe({
        next: (likedDto: LikedDto) => {
          deal.likeId = likedDto.Id;
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