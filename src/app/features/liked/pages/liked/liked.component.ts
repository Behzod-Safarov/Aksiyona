import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { LikedDto } from '../../../../core/models/liked-dto';
import { DealDto } from '../../../../core/models/deal-dto';

interface LikedDeal {
  like: LikedDto;
  deal: DealDto;
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
            this.likedDeals = likes.map((like, index) => ({
              like,
              deal: deals[index]
            }));
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
    imgElement.src = 'assets/placeholder.jpg'; // Fallback image
  }
}