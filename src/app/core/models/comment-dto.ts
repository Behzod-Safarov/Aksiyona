export interface CommentDto {
    Id?: number; // Optional, as it’s not sent in POST requests but is received in responses
    DealId: number;
    UserId: number;
    Username: string;
    Text: string;
    CreatedAt?: string; // Optional, as it’s not sent in POST requests but is received in responses
  }