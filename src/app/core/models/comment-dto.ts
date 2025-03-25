// src/app/core/models/comment-dto.ts
export interface CommentDto {
  id?: number;
  text: string; // Required per ApiService
  createdAt?: string;
  dealId: number; // Required
  userId: number; // Required
  username: string; // Required per ApiService
  rate?: number; // Optional, matches number | undefined
}