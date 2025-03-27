// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LikedDto } from '../core/models/liked-dto';
import { DealDto, UpdateReviewDto } from '../core/models/deal-dto';
import { CommentDto } from '../core/models/comment-dto';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiBaseUrl = 'http://localhost:5251/api';

  constructor(private http: HttpClient) {}

  getDeals(): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`${this.apiBaseUrl}/deal`);
  }

  getDeal(id: number): Observable<DealDto> {
    return this.http.get<DealDto>(`${this.apiBaseUrl}/Deal/${id}`);
  }

  addComment(comment: CommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.apiBaseUrl}/comment`, comment);
  }

  updateDeal(id: number, deal: DealDto): Observable<DealDto> {
    return this.http.put<DealDto>(`${this.apiBaseUrl}/deal/${id}`, deal);
  }

  // New method to update reviews
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
}