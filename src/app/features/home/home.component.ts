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
  deals: Deal[] = [
    {
      id: 1,
      image: 'reklama.jpg',
      title: "Up to 50% Off a Sam’s Club Membership: Big Savings!",
      price: 25,
      oldPrice: 50,
      discount: 50,
      rating: 1.5,
      reviews: 111982,
      expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 3 * 60 * 1000),
      timeLeft: '',
      liked: false,
      category: 'Membership',
      stock: 100
    },
    {
      id: 2,
      image: 'reklama.jpg',
      title: "Revitalize Your Look with Dysport or Jeuveau Injections!",
      price: 139.50,
      oldPrice: 349,
      discount: 60,
      rating: 4.8,
      reviews: 4183,
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000),
      timeLeft: '',
      liked: true,
      category: 'Beauty',
      stock: 50
    },
    {
      id: 3,
      image: 'reklama.jpg',
      title: "Save up to 50% - 360 Chicago, SkyDeck, FlyOver & more!",
      price: 79.80,
      oldPrice: 84,
      discount: 5,
      rating: 4.5,
      reviews: 23261,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 5 * 60 * 1000),
      timeLeft: '',
      liked: false,
      category: 'Travel',
      stock: 75
    },
    {
      id: 4,
      image: 'reklama.jpg',
      title: "Up to 50% Off a Sam’s Club Membership: Big Savings!",
      price: 25,
      oldPrice: 50,
      discount: 50,
      rating: 4.3,
      reviews: 111982,
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 6 * 60 * 1000),
      timeLeft: '',
      liked: false,
      category: 'Membership',
      stock: 100
    },
    {
      id: 5,
      image: 'reklama.jpg',
      title: "Revitalize Your Look with Dysport or Jeuveau Injections!",
      price: 139.50,
      oldPrice: 349,
      discount: 60,
      rating: 2.8,
      reviews: 4183,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000 + 7 * 60 * 1000),
      timeLeft: '',
      liked: true,
      category: 'Beauty',
      stock: 50
    },
    {
      id: 6,
      image: 'reklama.jpg',
      title: "Save up to 50% - 360 Chicago, SkyDeck, FlyOver & more!",
      price: 79.80,
      oldPrice: 84,
      discount: 5,
      rating: 2,
      reviews: 23261,
      expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 8 * 60 * 1000),
      timeLeft: '',
      liked: false,
      category: 'Travel',
      stock: 75
    }
  ];

  private countdownIntervals: any[] = [];

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadLikedState();
    this.startCountdowns();
  }

  ngOnDestroy(): void {
    this.countdownIntervals.forEach(interval => clearInterval(interval));
  }

  startCountdowns(): void {
    this.deals.forEach((deal, index) => {
      const updateTimer = () => {
        const now = new Date();
        const timeDiff = deal.expiryDate.getTime() - now.getTime();
        if (timeDiff <= 0) {
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

  loadLikedState(): void {
    const likedDeals = JSON.parse(localStorage.getItem('likedDeals') || '{}');
    this.deals.forEach(deal => {
      deal.liked = !!likedDeals[deal.id];
    });
  }

  saveLikedState(): void {
    const likedDeals = this.deals.reduce((acc, deal) => {
      acc[deal.id] = deal.liked;
      return acc;
    }, {} as { [key: number]: boolean });
    localStorage.setItem('likedDeals', JSON.stringify(likedDeals));
  }

  openDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggleLike(event: Event, index: number): void {
    event.stopPropagation();
    this.deals[index].liked = !this.deals[index].liked;
    this.saveLikedState();
  }

  trackByDealId(index: number, deal: Deal): number {
    return deal.id;
  }
}