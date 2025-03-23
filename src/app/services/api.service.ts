// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiBaseUrl = 'http://localhost:5251/api'; // Updated to your API URL

  constructor(private http: HttpClient) {}

  getDeals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/deal`);
  }

  getDeal(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/deal/${id}`);
  }

  addComment(comment: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/comment`, comment);
  }

  updateDeal(id: number, deal: any): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/deal/${id}`, deal);
  }

  toggleLike(dealId: number, liked: boolean): Observable<any> {
    return this.http.put(`${this.apiBaseUrl}/deal/${dealId}`, { liked });
  }
}