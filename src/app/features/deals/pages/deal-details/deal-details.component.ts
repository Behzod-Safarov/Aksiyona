import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface Comment {
  id: number;
  user: string;
  text: string;
  date: Date;
}

interface Deal {
  id: number;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  reviewsCount: number;
  rating: number;
  images: string[];
  seller: string;
  description: string;
  category: string;
  stock: number;
  expiryDate: Date;
  comments?: Comment[];
}

@Component({
  selector: 'app-deal-details',
  standalone: true,
  templateUrl: './deal-details.component.html',
  styleUrls: ['./deal-details.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class DealDetailsComponent implements OnInit, OnDestroy {
  dealId: string | null = null;
  deal: Deal | undefined;
  selectedImage: string = '';
  timeLeft: string = '';
  newComment: string = '';
  userRating: number = 0;
  previewRating: number = 0;
  recommendedDeals: Deal[] = [];
  private routeSub: Subscription | undefined;
  private countdownInterval: any;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.dealId = params['id'];
      console.log("Deal ID from route:", this.dealId);
      if (this.dealId) {
        this.fetchDealDetails(Number(this.dealId));
        this.fetchRecommendedDeals();
        this.startCountdown();
        // Scroll to top after route change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  fetchDealDetails(id: number): void {
    const mockDeals: Deal[] = [
      {
        id: 1,
        title: "Qulay hazm qilish uchun sut aralashmasi Kabrita 2 Gold, 400 gr",
        price: 258900,
        oldPrice: 639000,
        discount: 59,
        reviewsCount: 71,
        rating: 4.7,
        images: ["reklama.jpg", "reklama2.jpg", "reklama.jpg", "reklama2.jpg"],
        seller: "Kabrita",
        description:
          "Gollandiyada dehqonchilik an'analari va ko’p yillik ishlab chiqarish tajribasi tufayli...",
        category: "Baby Products",
        stock: 15,
        expiryDate: new Date('2025-03-22T12:00:00'),
        comments: [
          { id: 1, user: "Ali", text: "Great product!", date: new Date('2025-03-18') },
          { id: 2, user: "Sitora", text: "Worth the price!", date: new Date('2025-03-19') }
        ]
      },
      {
        id: 2,
        title: "Kabrita 3 Gold Baby Formula, 400 gr",
        price: 269000,
        oldPrice: 650000,
        discount: 58,
        reviewsCount: 45,
        rating: 4.5,
        images: ["reklama.jpg"],
        seller: "Kabrita",
        description: "Perfect for growing toddlers with easy digestion.",
        category: "Baby Products",
        stock: 20,
        expiryDate: new Date('2025-04-01T12:00:00')
      },
      {
        id: 3,
        title: "Organic Baby Diapers, Pack of 50",
        price: 150000,
        oldPrice: 200000,
        discount: 25,
        reviewsCount: 32,
        rating: 4.8,
        images: ["reklama2.jpg"],
        seller: "EcoBaby",
        description: "Soft and eco-friendly diapers for your baby.",
        category: "Baby Products",
        stock: 10,
        expiryDate: new Date('2025-05-15T12:00:00')
      }
    ];

    this.deal = mockDeals.find(d => d.id === id);
    if (this.deal?.images.length) {
      this.selectedImage = this.deal.images[0];
    } else {
      this.selectedImage = '';
    }
    console.log("Deal Data:", this.deal);
  }

  fetchRecommendedDeals(): void {
    const mockRecommendedDeals: Deal[] = [
      {
        id: 2,
        title: "Kabrita 3 Gold Baby Formula, 400 gr",
        price: 269000,
        oldPrice: 650000,
        discount: 58,
        reviewsCount: 45,
        rating: 4.5,
        images: ["reklama.jpg"],
        seller: "Kabrita",
        description: "Perfect for growing toddlers with easy digestion.",
        category: "Baby Products",
        stock: 20,
        expiryDate: new Date('2025-04-01T12:00:00')
      },
      {
        id: 3,
        title: "Organic Baby Diapers, Pack of 50",
        price: 150000,
        oldPrice: 200000,
        discount: 25,
        reviewsCount: 32,
        rating: 4.8,
        images: ["reklama2.jpg"],
        seller: "EcoBaby",
        description: "Soft and eco-friendly diapers for your baby.",
        category: "Baby Products",
        stock: 10,
        expiryDate: new Date('2025-05-15T12:00:00')
      }
    ];

    this.recommendedDeals = mockRecommendedDeals.filter(d => d.id !== Number(this.dealId));
    console.log("Recommended Deals:", this.recommendedDeals);
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  startCountdown(): void {
    if (!this.deal?.expiryDate) return;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = this.deal!.expiryDate.getTime() - now.getTime();
      if (timeDiff <= 0) {
        this.timeLeft = 'Expired';
        clearInterval(this.countdownInterval);
        return;
      }
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      this.timeLeft = `${days}d ${hours}h ${minutes}m`;
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 60000);
  }

  addComment(): void {
    if (this.newComment.trim() && this.deal) {
      const comment: Comment = {
        id: (this.deal.comments?.length || 0) + 1,
        user: "Anonymous",
        text: this.newComment,
        date: new Date()
      };
      this.deal.comments = [...(this.deal.comments || []), comment];
      this.newComment = '';
    }
  }

  setUserRating(rating: number): void {
    this.userRating = rating;
    this.previewRating = rating;
    console.log("User Rating Set To:", this.userRating);
  }

  previewRatingFunction(rating: number): void {
    this.previewRating = rating;
    console.log("Preview Rating:", this.previewRating);
  }

  resetPreview(): void {
    this.previewRating = this.userRating;
    console.log("Preview Reset To:", this.previewRating);
  }

  submitRating(): void {
    if (this.userRating >= 1 && this.userRating <= 5 && this.deal) {
      const newReviewsCount = this.deal.reviewsCount + 1;
      const newRating = ((this.deal.rating * this.deal.reviewsCount) + this.userRating) / newReviewsCount;
      this.deal.rating = Math.round(newRating * 10) / 10;
      this.deal.reviewsCount = newReviewsCount;
      console.log("Updated Deal Rating:", this.deal.rating, "Reviews:", this.deal.reviewsCount);
      this.userRating = 0;
      this.previewRating = 0;
    } else {
      console.log("Invalid rating or no deal:", this.userRating, this.deal);
    }
  }

  viewDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log("Navigated to deal:", deal.id);
    });
  }
}