import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { LikedDto } from '../../../../core/models/liked-dto';
import { DealDto } from '../../../../core/models/deal-dto';
import { API_URLS } from '../../../../core/constants/api_urls';

interface LikedDeal {
  like: LikedDto;
  deal: {
    Id: number;
    images: string[];
    Title: string;
    Price: number;
    OldPrice: number;
    Discount: number;
    Rating: number;
    Reviews: number;
    ExpiryDate: string;
    DealStartingDate: string;
    SubcategoryId: number;
    Stock: number;
    CreatedAt: string;
    Region?: string;
    Subregion?: string;
    UserId?: number;
  };
}

@Component({
  selector: 'app-liked',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './liked.component.html',
  styleUrls: ['./liked.component.scss']
})
export class LikedComponent implements OnInit, OnDestroy {
  likedDeals: LikedDeal[] = [];
  userId: number | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;
  private authSub: Subscription | undefined;
  public BASE_URL = API_URLS.BASE_URL;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.userId$.subscribe(userId => {
      this.userId = userId;
      if (this.userId) {
        this.loadLikedDeals();
      } else {
        this.errorMessage = 'User not authenticated. Please log in.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  loadLikedDeals(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getUserLikedDeals(this.userId).subscribe({
      next: (likes) => {
        if (likes.length === 0) {
          this.likedDeals = [];
          this.isLoading = false;
          return;
        }

        const dealObservables: Observable<DealDto>[] = likes.map(like =>
          this.apiService.getDeal(like.dealId)
        );

        forkJoin(dealObservables).subscribe({
          next: (deals) => {
            this.likedDeals = likes.map((like, index) => {
              const dto = deals[index];
              const images = dto.image
                ? dto.image.split(',')
                    .filter(img => img.trim() !== '')
                    .map(img => img.startsWith('http') ? img : `${this.BASE_URL}/${img.trim()}`) // Avoid double-prefixing
                : [`${this.BASE_URL}/images/placeholder.jpg`];
              return {
                like,
                deal: {
                  Id: dto.id,
                  images,
                  Title: dto.title,
                  Price: dto.price,
                  OldPrice: dto.oldPrice,
                  Discount: dto.discount,
                  Rating: dto.rating,
                  Reviews: dto.reviews,
                  ExpiryDate: dto.expiryDate,
                  DealStartingDate: dto.dealStartingDate,
                  SubcategoryId: dto.subcategoryId,
                  Stock: dto.stock ?? 0, // Default to 0 if undefined
                  CreatedAt: dto.createdAt,
                  Region: dto.region,
                  Subregion: dto.subRegion,
                  UserId: dto.userId
                }
              };
            });
            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = 'Failed to load deal details. Please try again.';
            this.isLoading = false;
            console.error('Error fetching deal details:', err);
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load liked deals. Please try again.';
        this.isLoading = false;
        console.error('Error fetching liked deals:', err);
      }
    });
  }

  unlikeDeal(likeId: number): void {
    this.apiService.removeLike(likeId).subscribe({
      next: () => {
        this.likedDeals = this.likedDeals.filter(likedDeal => likedDeal.like.Id !== likeId);
      },
      error: (err) => {
        this.errorMessage = 'Failed to remove like. Please try again.';
        console.error('Error removing like:', err);
      }
    });
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/placeholder.jpg'; // Consistent with template fallback
  }
}