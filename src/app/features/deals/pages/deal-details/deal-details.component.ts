import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

interface Comment {
  id: number;
  username: string;
  text: string;
  createdAt: Date;
}

interface Deal {
  id: number;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  reviews: number;
  rating: number;
  images: string[]; // Updated to array to match template expectation
  description: string;
  category: string;
  stock: number;
  expiryDate: Date;
  comments: Comment[];
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.dealId = params['id'];
      console.log("Deal ID from route:", this.dealId);
      if (this.dealId) {
        this.fetchDealDetails(Number(this.dealId));
        this.fetchRecommendedDeals();
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
    this.apiService.getDeal(id).subscribe({
      next: (dealData) => {
        const expiryDate = dealData.ExpiryDate ? new Date(dealData.ExpiryDate) : new Date();
        this.deal = {
          id: dealData.Id ?? 0,
          title: dealData.Title ?? 'Untitled Deal',
          price: dealData.Price ?? 0,
          oldPrice: dealData.OldPrice ?? 0,
          discount: dealData.Discount ?? 0,
          reviews: dealData.Reviews ?? 0,
          rating: dealData.Rating ?? 0,
          images: dealData.Image ? [dealData.Image] : ['placeholder.jpg'], // Convert single Image to array
          description: dealData.Description || 'No description available',
          category: dealData.Category ?? 'Unknown',
          stock: dealData.Stock ?? 0,
          expiryDate: expiryDate,
          comments: dealData.Comments?.map((c: any) => ({
            id: c.Id ?? 0,
            username: c.Username ?? 'Anonymous',
            text: c.Text ?? '',
            createdAt: c.CreatedAt ? new Date(c.CreatedAt) : new Date()
          })) ?? []
        };
        this.selectedImage = this.deal.images[0] || 'placeholder.jpg';
        this.startCountdown();
        console.log("Deal Data from API:", this.deal);
      },
      error: (err) => {
        console.error("Error fetching deal details:", err);
        this.deal = undefined;
      }
    });
  }

  fetchRecommendedDeals(): void {
    this.apiService.getDeals().subscribe({
      next: (deals) => {
        this.recommendedDeals = deals
          .filter((d: any) => d.Id !== Number(this.dealId))
          .slice(0, 2)
          .map((d: any) => ({
            id: d.Id ?? 0,
            title: d.Title ?? 'Untitled Deal',
            price: d.Price ?? 0,
            oldPrice: d.OldPrice ?? 0,
            discount: d.Discount ?? 0,
            reviews: d.Reviews ?? 0,
            rating: d.Rating ?? 0,
            images: d.Image ? [d.Image] : ['placeholder.jpg'],
            description: d.Description || 'No description available',
            category: d.Category ?? 'Unknown',
            stock: d.Stock ?? 0,
            expiryDate: d.ExpiryDate ? new Date(d.ExpiryDate) : new Date(),
            comments: d.Comments?.map((c: any) => ({
              id: c.Id ?? 0,
              username: c.Username ?? 'Anonymous',
              text: c.Text ?? '',
              createdAt: c.CreatedAt ? new Date(c.CreatedAt) : new Date()
            })) ?? []
          }));
        console.log("Recommended Deals from API:", this.recommendedDeals);
      },
      error: (err) => {
        console.error("Error fetching recommended deals:", err);
        this.recommendedDeals = [];
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  startCountdown(): void {
    if (!this.deal?.expiryDate || isNaN(this.deal.expiryDate.getTime())) {
      this.timeLeft = 'Invalid Date';
      return;
    }

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
      const commentPayload = {
        DealId: this.deal.id,
        UserId: 1, // Placeholder: Replace with actual user ID from auth service
        Text: this.newComment,
        CreatedAt: new Date()
      };

      this.apiService.addComment(commentPayload).subscribe({
        next: (newComment) => {
          const comment: Comment = {
            id: newComment.Id ?? 0,
            username: newComment.Username || 'Anonymous',
            text: newComment.Text ?? '',
            createdAt: newComment.CreatedAt ? new Date(newComment.CreatedAt) : new Date()
          };
          this.deal!.comments = [...(this.deal!.comments || []), comment];
          this.newComment = '';
          console.log("Comment added:", comment);
        },
        error: (err) => {
          console.error("Error adding comment:", err);
        }
      });
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
      const newReviewsCount = this.deal.reviews + 1;
      const newRating = ((this.deal.rating * this.deal.reviews) + this.userRating) / newReviewsCount;
      this.deal.rating = Math.round(newRating * 10) / 10;
      this.deal.reviews = newReviewsCount;
      console.log("Updated Deal Rating:", this.deal.rating, "Reviews:", this.deal.reviews);

      this.apiService.updateDeal(this.deal.id, {
        Id: this.deal.id,
        Rating: this.deal.rating,
        Reviews: this.deal.reviews,
        Title: this.deal.title,
        Price: this.deal.price,
        OldPrice: this.deal.oldPrice,
        Discount: this.deal.discount,
        Stock: this.deal.stock,
        ExpiryDate: this.deal.expiryDate.toISOString(),
        Category: this.deal.category,
        Image: this.deal.images[0],
        Comments: this.deal.comments.map(c => ({
          Id: c.id,
          Username: c.username,
          Text: c.text,
          CreatedAt: c.createdAt.toISOString(),
          DealId: this.deal!.id,
          UserId: 1 // Placeholder
        }))
      }).subscribe({
        next: () => console.log("Rating updated on backend"),
        error: (err) => console.error("Error updating rating:", err)
      });

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