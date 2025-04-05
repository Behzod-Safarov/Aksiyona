import { SubcategoryDto } from "./sub-category-dto";

export interface CategoryDto {
    id: number;
    name: string;
    subcategories: SubcategoryDto[];
  }