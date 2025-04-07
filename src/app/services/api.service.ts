import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { LikedDto } from '../core/models/liked-dto';
import { DealDto, UpdateReviewDto } from '../core/models/deal-dto';
import { CommentDto } from '../core/models/comment-dto';
import { CategoryDto } from '../core/models/category-dto';
import { LocationDto } from '../core/models/location-dto';
import { UserDto } from '../core/models/user-dto';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBaseUrl = 'http://localhost:5251/api';
  private readonly BASE_URL = 'http://localhost:5251';

  constructor(private http: HttpClient) {}

  getRecentNotifications(count: number = 5): Observable<any[]> {
    return this.http
      .get<DealDto[]>(`${this.apiBaseUrl}/Notification`)
      .pipe(
        map((deals: DealDto[]) =>
          deals.slice(0, count).map((deal) => {
            const imageUrl = deal.image
              ? `${this.BASE_URL}${deal.image.split(',').map(img => img.trim())[0]}`
              : `${this.BASE_URL}/images/placeholder.jpg`;

            return {
              id: deal.id,
              title: 'New Deal: ' + deal.title,
              description: `Save ${deal.discount}% on ${deal.title}!`,
              image: imageUrl,
            };
          })
        )
      );
  }

  getDeals(pageNumber: number = 1, pageSize: number = 10): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`${this.apiBaseUrl}/deal?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  getDeal(id: number): Observable<DealDto> {
    return this.http.get<DealDto>(`${this.apiBaseUrl}/Deal/${id}`);
  }

  getDealByUserId(userId: number): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`${this.apiBaseUrl}/Deal/getByUserId/${userId}`);
  }

  addComment(comment: CommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.apiBaseUrl}/comment`, comment);
  }

  // api.service.ts
  updateDeal(id: number, deal: DealDto): Observable<DealDto> {  // Revert to DealDto
    return this.http.put<DealDto>(`${this.apiBaseUrl}/Deal/${id}`, deal);
  }
 
  updateDealWithFormData(id: number, deal: FormData): Observable<DealDto> {
    return this.http.put<DealDto>(`${this.apiBaseUrl}/Deal/${id}`, deal);
  }

  updateReview(id: string, reviewData: UpdateReviewDto): Observable<DealDto> {
    return this.http.patch<DealDto>(`${this.apiBaseUrl}/deal/${id}/reviews`, reviewData);
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiBaseUrl}/User/login`, { username, password });
  }

  getUserLikedDeals(userId: number): Observable<LikedDto[]> {
    console.log('taking likedDtos: ', userId);
    return this.http.get<LikedDto[]>(`${this.apiBaseUrl}/Liked/user/${userId}`);
  }

  addLike(liked: { userId: number; dealId: number }): Observable<LikedDto> {
    console.log('came to add like');
    return this.http.post<LikedDto>(`${this.apiBaseUrl}/Liked`, liked);
  }

  removeLike(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/liked/${id}`);
  }

  // New method to add a deal
  addDeal(deal: FormData): Observable<DealDto> {
    return this.http.post<DealDto>(`${this.apiBaseUrl}/Deal`, deal);
  }
  removeDeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/deal/${id}`);
  }
  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.apiBaseUrl}/Category`);
  }

  getLocations(): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${this.apiBaseUrl}/Location`);
  }
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiBaseUrl}/UserConfig/users`);
  }

  // Admin: Delete a user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/UserConfig/users/${id}`);
  }

  // Admin: Get all active deals
  getActiveDeals(): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`${this.apiBaseUrl}/UserConfig/deals`);
  }

  // Admin: Get all pending deals (new deals)
  getPendingDeals(): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`${this.apiBaseUrl}/UserConfig/new-deals`);
  }

  // Admin: Delete a deal
  deleteDeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/UserConfig/deals/${id}`);
  }

  // Admin: Activate a pending deal
  activateDeal(id: number): Observable<DealDto> {
    return this.http.patch<DealDto>(`${this.apiBaseUrl}/UserConfig/new-deals/${id}/activate`, {});
  }
}