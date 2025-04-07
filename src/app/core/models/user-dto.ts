import { DealDto } from "./deal-dto";

export interface UserDto {
    id: number;
    username: string;
    phoneNumber: string;
    deals: DealDto[];
  }