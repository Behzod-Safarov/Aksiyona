import { CommentDto } from "./comment-dto";

export interface DealDto {
  Id: number;
  Image: string;
  Title: string;
  Price: number;
  OldPrice: number;
  Discount: number;
  Rating: number;
  Reviews: number;
  ExpiryDate: string;
  Category: string;
  Stock: number;
  Comments?: CommentDto[]; // Optional, as it may not be present in all responses
}