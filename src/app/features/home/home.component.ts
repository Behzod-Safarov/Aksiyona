import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

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

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchDeals();
  }

  ngOnDestroy(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
  }

  fetchDeals(): void {
    this.loading = true;
    this.error = null;
    this.apiService.getDeals().subscribe({
      next: (deals) => {
        this.deals = deals.map(deal => {
          const expiryDate = deal.ExpiryDate ? new Date(deal.ExpiryDate) : new Date();
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
            liked: deal.Liked ?? false,
            category: deal.Category ?? 'Unknown',
            stock: deal.Stock ?? 0
          };
        }).filter(deal => !isNaN(deal.expiryDate.getTime())); // Filter out invalid dates
        this.startCountdowns();
        this.loading = false;
        console.log("Deals fetched from API:", this.deals);
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
    const deal = this.deals[index];
    deal.liked = !deal.liked;

    this.apiService.toggleLike(deal.id, deal.liked).subscribe({
      next: () => {
        console.log(`Deal ${deal.id} liked state updated to ${deal.liked} on backend`);
      },
      error: (err) => {
        console.error(`Error updating liked state for deal ${deal.id}:`, err);
        deal.liked = !deal.liked;
      }
    });
  }

  trackByDealId(index: number, deal: Deal): number {
    return deal.id;
  }
}