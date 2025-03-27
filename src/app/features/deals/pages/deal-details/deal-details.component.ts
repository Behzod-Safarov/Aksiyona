import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { DealDto, UpdateReviewDto } from '../../../../core/models/deal-dto';
import { LikedDto } from '../../../../core/models/liked-dto';
import { ApiService } from '../../../../services/api.service';
import { CommentDto } from '../../../../core/models/comment-dto';

interface Comment {
  id: number;
  username: string;
  text?: string;
  createdAt: Date;
  rate?: number;
  userId: number;
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
  isdealReRated: boolean = false;
  userRating: number = 0;
  previewRating: number = 0;
  recommendedDeals: Deal[] = [];
  comments: CommentDto[] = []
  userId: number | null = null;
  generalRate: number = 0;
  error: string | null = null;
  private routeSub: Subscription | undefined;
  private countdownInterval: any;
  private authSub: Subscription | undefined;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');
    this.isdealReRated = false;
    this.authSub = this.authService.userId$.subscribe(userId => {
      this.userId = userId;
      console.log('User ID from AuthService:', this.userId);
      if (this.userId && this.deal) {
        this.fetchLikedState();
        this.setUserRatingFromComments(); // Set existing rating if user is signed in
      }
      if (this.userId && this.recommendedDeals.length > 0) {
        this.updateRecommendedDealsLikedState();
      }
    });

    this.routeSub = this.route.params.subscribe(params => {
      this.dealId = params['id'];
      console.log('Deal ID from route:', this.dealId);
      if (this.dealId) {
        console.log('came here')
        this.updateDealReviews(this.dealId)
        this.fetchDealDetails(Number(this.dealId));
        this.fetchRecommendedDeals();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.setDefaultDeal();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.authSub) this.authSub.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private setDefaultDeal(): void {
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

  fetchDealDetails(id: number): void {
    this.apiService.getDeal(id).subscribe({
      next: (dealData: DealDto) => {
        const expiryDate = this.parseDate(dealData.expiryDate);
        this.deal = this.mapDealDtoToDeal(dealData, expiryDate);
        

        
        const validRates = this.deal.comments
                          .map(x => x.rate)
                          .filter(rate => rate !== null && rate !== undefined);

        this.generalRate = validRates.length > 0 
          ? validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length 
          : 0; // Default to 0 if no valid rates exist
         
        this.comments = this.deal.comments
          .filter(x => x.text != null)
          .map(comment => ({
            id: comment.id,
            text: comment.text!,
            createdAt: comment.createdAt.toISOString(),
            dealId: this.deal!.id,
            userId: comment.userId,
            username: comment.username,
            rate: comment.rate
          }));

        this.selectedImage = this.deal.images[0] || 'placeholder.jpg';
        if (this.userId) {
          this.fetchLikedState();
          this.setUserRatingFromComments(); // Set user's existing rating
        }
        this.startCountdown();
      },
      error: (err) => {
        console.error('Error fetching deal details:', err);
        this.error = 'Failed to load deal details. Please try again later.';
        this.deal = undefined;
      }
    });
  }

  private setUserRatingFromComments(): void {
    if (this.userId && this.deal?.comments) {
      const userComment = this.deal.comments.find(c => c.userId === this.userId && c.rate !== undefined);
      this.userRating = userComment?.rate || 0;
      this.previewRating = this.userRating;
      console.log('User rating set from existing comment:', this.userRating);
    }
  }

  private fetchLikedState(): void {
    if (!this.userId || !this.deal) return;

    this.apiService.getUserLikedDeals(this.userId).subscribe({
      next: (likedDeals: LikedDto[]) => {
        const likedDeal = likedDeals.find(liked => liked.dealId === this.deal!.id);
        if (this.deal) {
          this.deal.liked = !!likedDeal;
          this.deal.likeId = likedDeal ? likedDeal.Id : undefined;
        }
        console.log('Deal liked state updated:', this.deal?.liked);
      },
      error: (err) => {
        console.error('Error fetching liked deals:', err);
      }
    });
  }

  fetchRecommendedDeals(): void {
    this.apiService.getDeals().subscribe({
      next: (deals: DealDto[]) => {
        this.recommendedDeals = deals
          .filter((d: DealDto) => d.id !== Number(this.dealId))
          .slice(0, 2)
          .map((d: DealDto) => this.mapDealDtoToDeal(d, this.parseDate(d.expiryDate)));
        if (this.userId) {
          this.updateRecommendedDealsLikedState();
        }
      },
      error: (err) => {
        console.error('Error fetching recommended deals:', err);
        this.error = 'Failed to load recommended deals. Please try again later.';
        this.recommendedDeals = [];
      }
    });
  }

  private parseDate(dateString?: string): Date {
    const date = dateString ? new Date(dateString) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : date;
  }

  private mapDealDtoToDeal(dto: DealDto, expiryDate: Date): Deal {
    return {
      id: dto.id ?? 0,
      title: dto.title ?? 'Untitled Deal',
      price: dto.price ?? 0,
      oldPrice: dto.oldPrice ?? 0,
      discount: dto.discount ?? 0,
      reviews: dto.reviews ?? 0,
      rating: dto.rating ?? 0,
      images: dto.image ? [dto.image] : ['placeholder.jpg'],
      description: dto.title || 'No description available',
      category: dto.category ?? 'Unknown',
      stock: dto.stock ?? 0,
      expiryDate,
      comments: (dto.comments ?? []).map((c: CommentDto) => ({
        id: c.id ?? 0,
        username: c.username ?? 'Anonymous',
        text: c.text,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        rate: c.rate,
        userId: c.userId // Include userId for tracking
      })),
      liked: false,
      likeId: undefined
    };
  }

  private updateRecommendedDealsLikedState(): void {
    if (!this.userId) return;

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
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    if (this.newComment.trim() && this.deal) {
      const commentPayload: CommentDto = {
        dealId: this.deal.id,
        userId: this.userId!,
        username: this.userId ? 'User' : 'Anonymous', // Username will be set by backend based on UserId
        text: this.newComment,
        createdAt: new Date().toISOString(),
        rate: undefined
      };

      this.apiService.addComment(commentPayload).subscribe({
        next: (newComment) => {
          const comment: Comment = {
            id: newComment.id ?? 0,
            username: newComment.username || 'Anonymous',
            text: newComment.text,
            createdAt: newComment.createdAt ? new Date(newComment.createdAt) : new Date(),
            rate: newComment.rate,
            userId: newComment.userId
          };
          this.deal!.comments = [...(this.deal!.comments || []), comment];
          this.newComment = '';
          console.log('Comment added:', comment);
        },
        error: (err) => {
          console.error('Error adding comment:', err);
          this.error = 'Failed to add comment. Please try again.';
        }
      });
    }
  }

  toggleLike(event: Event): void {
    event.stopPropagation();
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    if (!this.deal) return;

    const wasLiked = this.deal.liked;
    this.deal.liked = !this.deal.liked;

    if (this.deal.liked) {
      this.apiService.addLike({ userId: this.userId!, dealId: this.deal.id }).subscribe({
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
    this.isdealReRated = true
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
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }
    
    this.isdealReRated = false;
    if (this.userRating >= 1 && this.userRating <= 5 && this.deal) {
      const commentPayload: CommentDto = {
        dealId: this.deal.id,
        userId: this.userId!,
        username: this.userId ? 'User' : 'Anonymous', // Backend will set this based on UserId
        text: this.newComment,
        createdAt: new Date().toISOString(),
        rate: this.userRating
      };

      this.apiService.addComment(commentPayload).subscribe({
        next: (newComment) => {
          const comment: Comment = {
            id: newComment.id ?? 0,
            username: newComment.username || 'Anonymous',
            text: undefined,
            createdAt: newComment.createdAt ? new Date(newComment.createdAt) : new Date(),
            rate: newComment.rate,
            userId: newComment.userId
          };

          const existingCommentIndex = this.deal!.comments.findIndex(c => c.userId === this.userId && c.rate !== undefined);
          if (existingCommentIndex >= 0) {
            // Update existing rating
            this.deal!.comments[existingCommentIndex] = comment;
            console.log('Rating updated:', comment);
          } else {
            // Add new rating
            this.deal!.comments = [...(this.deal!.comments || []), comment];
            console.log('Rating added:', comment);
          }

          this.fetchDealDetails(this.deal!.id); // Refresh deal details to update average rating
          this.newComment = '';
          this.userRating = comment.rate || 0; // Keep the rating displayed
          this.previewRating = this.userRating;
        },
        error: (err) => {
          console.error('Error submitting rating:', err);
          this.error = 'Failed to submit rating. Please try again.';
        }
      });
    }
  }

  viewDeal(deal: Deal): void {
    this.router.navigate(['/deal', deal.id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('Navigated to deal:', deal.id);
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private redirectToLogin(): void {
    const returnUrl = this.router.url; // Current URL to return to after login
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
    this.error = 'Please log in to comment or rate this deal.';
  }

  private updateDealReviews(dealId: string): void {
    const reviewData: UpdateReviewDto = {
      id: dealId,
    };
    
    this.apiService.updateReview(dealId, reviewData).subscribe({
      next: (updatedDeal: DealDto) => {
        console.log('Deal reviews updated:', updatedDeal);
        this.deal!.reviews = updatedDeal.reviews; // Update local deal
      },
      error: (err) => {
        console.error('Error updating deal reviews:', err);
        this.error = 'Failed to update deal reviews.';
      }
    });
  }
}