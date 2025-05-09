import { CommentDto } from './comment-dto';

export interface DealDto {
  id: number;
  image: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  expiryDate: string;
  liked: boolean;
  subcategoryId: number;
  category: string;
  stock?: number;
  createdAt: string;
  dealStartingDate: string;
  comments: CommentDto[];
  notifications: any[];
  location?: string;
  region?: string;
  subRegion?: string;
  userId?: number;
}


export interface UpdateReviewDto {
 id: string;
}