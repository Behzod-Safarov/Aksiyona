import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service'; // Adjust path as per your structure
import { forkJoin, Observable } from 'rxjs';
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
export class LikedComponent implements OnInit {
  likedDeals: LikedDeal[] = [];
  userId: number | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Extract userId from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        this.userId = payload.userId || null; // Adjust based on your JWT structure
      } catch (error) {
        console.error('Error decoding token:', error);
        this.errorMessage = 'Invalid token. Please log in again.';
      }
    }

    if (this.userId) {
      this.loadLikedDeals();
    } else {
      this.errorMessage = 'User not authenticated. Please log in.';
    }
  }

  loadLikedDeals(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getUserLikedDeals(this.userId).subscribe({
      next: (likes) => {
        // For each like, fetch the corresponding deal details
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
}