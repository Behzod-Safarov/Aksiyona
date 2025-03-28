// src/app/services/filter.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private selectedCategoriesSubject = new BehaviorSubject<string[]>([]);
  private selectedLocationsSubject = new BehaviorSubject<{ [key: string]: string[] }>({});

  searchQuery$ = this.searchQuerySubject.asObservable();
  selectedCategories$ = this.selectedCategoriesSubject.asObservable();
  selectedLocations$ = this.selectedLocationsSubject.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setSelectedCategories(categories: string[]) {
    this.selectedCategoriesSubject.next(categories);
  }

  setSelectedLocations(locations: { [key: string]: string[] }) {
    this.selectedLocationsSubject.next(locations);
  }
}