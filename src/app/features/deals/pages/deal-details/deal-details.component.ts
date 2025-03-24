import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { DealDto } from '../../../../core/models/deal-dto';
import { LikedDto } from '../../../../core/models/liked-dto';
import { CommentDto } from '../../../../core/models/comment-dto';

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
  images: string[];
  description: string;
  category: string;
  stock: number;
  expiryDate: Date;
  comments: Comment[];
  liked: boolean;
  likeId?: number;
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
  userId: number | null = null;
  error: string | null = null;
  private routeSub: Subscription | undefined;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');

    // Extract userId from JWT token if available (optional)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userId = payload.userId || null; // Adjust based on your JWT structure
        console.log('User ID extracted from token:', this.userId);
      } catch (error) {
        console.error('Error decoding token:', error);
        this.userId = null; // Explicitly set to null if token decoding fails
      }
    } else {
      console.log('No token found, user is not logged in');
    }

    this.routeSub = this.route.params.subscribe(params => {
      this.dealId = params['id'];
      console.log('Deal ID from route:', this.dealId);
      if (this.dealId) {
        this.fetchDealDetails(Number(this.dealId));
        this.fetchRecommendedDeals();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.log('No dealId found, setting default deal');
        this.deal = {
          id: 0,
          title: 'Test Deal',
          price: 100,
          oldPrice: 150,
          discount: 33,
          reviews: 0,
          rating: 0,
          images: ['placeholder.jpg'],
          description: 'Test description',
          category: 'Test',
          stock: 10,
          expiryDate: new Date(),
          comments: [],
          liked: false,
          likeId: undefined
        };
        this.selectedImage = this.deal.images[0];
        this.startCountdown();
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
      next: (dealData: DealDto) => {
        const expiryDate = dealData.ExpiryDate ? new Date(dealData.ExpiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (isNaN(expiryDate.getTime())) {
          console.warn(`Invalid ExpiryDate for deal ${dealData.Id}, using default date`);
          expiryDate.setTime(Date.now() + 24 * 60 * 60 * 1000);
        }
        this.deal = {
          id: dealData.Id ?? 0,
          title: dealData.Title ?? 'Untitled Deal',
          price: dealData.Price ?? 0,
          oldPrice: dealData.OldPrice ?? 0,
          discount: dealData.Discount ?? 0,
          reviews: dealData.Reviews ?? 0,
          rating: dealData.Rating ?? 0,
          images: dealData.Image ? [dealData.Image] : ['placeholder.jpg'],
          description: dealData.Title || 'No description available',
          category: dealData.Category ?? 'Unknown',
          stock: dealData.Stock ?? 0,
          expiryDate: expiryDate,
          comments: dealData.Comments?.map((c: CommentDto) => ({
            id: c.Id ?? 0,
            username: c.Username ?? 'Anonymous',
            text: c.Text ?? '',
            createdAt: c.CreatedAt ? new Date(c.CreatedAt) : new Date()
          })) ?? [],
          liked: false,
          likeId: undefined
        };
        this.selectedImage = this.deal.images[0] || 'placeholder.jpg';

        // Fetch liked state only if user is logged in
        if (this.userId) {
          this.apiService.getUserLikedDeals(this.userId).subscribe({
            next: (likedDeals: LikedDto[]) => {
              const likedDeal = likedDeals.find(liked => liked.dealId === this.deal!.id);
              if (this.deal) {
                this.deal.liked = !!likedDeal;
                this.deal.likeId = likedDeal ? likedDeal.Id : undefined;
              }
              console.log('Deal liked state updated:', this.deal?.liked);
              this.startCountdown();
            },
            error: (err) => {
              console.error('Error fetching liked deals:', err);
              this.startCountdown();
            }
          });
        } else {
          console.log('User not logged in, skipping liked deals fetch');
          this.startCountdown();
        }
      },
      error: (err) => {
        console.error('Error fetching deal details:', err);
        this.error = 'Failed to load deal details. Please try again later.';
        this.deal = undefined;
      }
    });
  }

  fetchRecommendedDeals(): void {
    this.apiService.getDeals().subscribe({
      next: (deals: DealDto[]) => {
        this.recommendedDeals = deals
          .filter((d: DealDto) => d.Id !== Number(this.dealId))
          .slice(0, 2)
          .map((d: DealDto) => {
            const expiryDate = d.ExpiryDate ? new Date(d.ExpiryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
            if (isNaN(expiryDate.getTime())) {
              console.warn(`Invalid ExpiryDate for recommended deal ${d.Id}, using default date`);
              expiryDate.setTime(Date.now() + 24 * 60 * 60 * 1000);
            }
            return {
              id: d.Id ?? 0,
              title: d.Title ?? 'Untitled Deal',
              price: d.Price ?? 0,
              oldPrice: d.OldPrice ?? 0,
              discount: d.Discount ?? 0,
              reviews: d.Reviews ?? 0,
              rating: d.Rating ?? 0,
              images: d.Image ? [d.Image] : ['placeholder.jpg'],
              description: d.Title || 'No description available',
              category: d.Category ?? 'Unknown',
              stock: d.Stock ?? 0,
              expiryDate: expiryDate,
              comments: d.Comments?.map((c: CommentDto) => ({
                id: c.Id ?? 0,
                username: c.Username ?? 'Anonymous',
                text: c.Text ?? '',
                createdAt: c.CreatedAt ? new Date(c.CreatedAt) : new Date()
              })) ?? [],
              liked: false,
              likeId: undefined
            };
          });

        if (this.userId) {
          this.apiService.getUserLikedDeals(this.userId).subscribe({
            next: (likedDeals: LikedDto[]) => {
              this.recommendedDeals = this.recommendedDeals.map(deal => {
                const likedDeal = likedDeals.find(liked => liked.dealId === deal.id);
                return {
                  ...deal,
                  liked: !!likedDeal,
                  likeId: likedDeal ? likedDeal.Id : undefined
                };
              });
              console.log('Recommended Deals liked states updated:', this.recommendedDeals);
            },
            error: (err) => {
              console.error('Error fetching liked deals for recommended deals:', err);
            }
          });
        } else {
          console.log('User not logged in, skipping liked states for recommended deals');
        }
      },
      error: (err) => {
        console.error('Error fetching recommended deals:', err);
        this.error = 'Failed to load recommended deals. Please try again later.';
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
    if (!this.userId) {
      console.log('User not logged in, redirecting to login for commenting');
      this.router.navigate(['/login']);
      return;
    }

    if (this.newComment.trim() && this.deal) {
      const commentPayload = {
        dealId: this.deal.id,
        userId: this.userId,
        username: 'Anonymous',
        text: this.newComment,
        createdAt: new Date().toISOString()
      };

      this.apiService.addComment(commentPayload).subscribe({
        next: (newComment) => {
          const comment: Comment = {
            id: newComment.id ?? 0,
            username: newComment.username || 'Anonymous',
            text: newComment.text ?? '',
            createdAt: newComment.createdAt ? new Date(newComment.createdAt) : new Date()
          };
          this.deal!.comments = [...(this.deal!.comments || []), comment];
          this.newComment = '';
          console.log('Comment added:', comment);
        },
        error: (err) => {
          console.error('Error adding comment:', err);
        }
      });
    }
  }

  toggleLike(event: Event): void {
    event.stopPropagation();

    if (!this.userId) {
      console.log('User not logged in, like action skipped');
      this.error = 'Please log in to like this deal.'; // Optional feedback
      return;
    }

    if (!this.deal) return;

    const wasLiked = this.deal.liked;
    this.deal.liked = !this.deal.liked;

    if (this.deal.liked) {
      this.apiService.addLike({ userId: this.userId, dealId: this.deal.id }).subscribe({
        next: (likedDto: LikedDto) => {
          this.deal!.likeId = likedDto.Id;
          console.log(`Deal ${this.deal!.id} liked by user ${this.userId}`);
        },
        error: (err) => {
          console.error(`Error liking deal ${this.deal!.id}:`, err);
          this.deal!.liked = wasLiked;
          this.error = 'Failed to like the deal. Please try again.';
        }
      });
    } else {
      if (this.deal.likeId) {
        this.apiService.removeLike(this.deal.likeId).subscribe({
          next: () => {
            this.deal!.likeId = undefined;
            console.log(`Like removed for deal ${this.deal!.id} by user ${this.userId}`);
          },
          error: (err) => {
            console.error(`Error unliking deal ${this.deal!.id}:`, err);
            this.deal!.liked = wasLiked;
            this.error = 'Failed to unlike the deal. Please try again.';
          }
        });
      }
    }
  }

  setUserRating(rating: number): void {
    this.userRating = rating;
    this.previewRating = rating;
    console.log('User Rating Set To:', this.userRating);
  }

  previewRatingFunction(rating: number): void {
    this.previewRating = rating;
    console.log('Preview Rating:', this.previewRating);
  }

  resetPreview(): void {
    this.previewRating = this.userRating;
    console.log('Preview Reset To:', this.previewRating);
  }

  submitRating(): void {
    if (!this.userId) {
      console.log('User not logged in, redirecting to login for rating');
      this.router.navigate(['/login']);
      return;
    }

    if (this.userRating >= 1 && this.userRating <= 5 && this.deal) {
      const newReviewsCount = this.deal.reviews + 1;
      const newRating = ((this.deal.rating * this.deal.reviews) + this.userRating) / newReviewsCount;
      this.deal.rating = Math.round(newRating * 10) / 10;
      this.deal.reviews = newReviewsCount;
      console.log('Updated Deal Rating:', this.deal.rating, 'Reviews:', this.deal.reviews);

      this.apiService.updateDeal(this.deal.id, {
        Id: this.deal.id,
        Title: this.deal.title,
        Price: this.deal.price,
        OldPrice: this.deal.oldPrice,
        Discount: this.deal.discount,
        Rating: this.deal.rating,
        Reviews: this.deal.reviews,
        Stock: this.deal.stock,
        ExpiryDate: this.deal.expiryDate.toISOString(),
        Category: this.deal.category,
        Image: this.deal.images[0]
      } as DealDto).subscribe({
        next: () => console.log('Rating updated on backend'),
        error: (err) => console.error('Error updating rating:', err)
      });

      this.userRating = 0;
      this.previewRating = 0;
    } else {
      console.log('Invalid rating or no deal:', this.userRating, this.deal);
    }
  }

  viewDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('Navigated to deal:', deal.id);
    });
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }
}