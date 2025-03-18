import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common'; // ✅ Explicitly import NgFor

interface Deal {
  title: string;
  store: string;
  location: string;
  image: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  rating: number;
  reviews: number;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, NgFor], // ✅ Add NgFor to imports
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent {
  deals: Deal[] = [
    {
      title: "Sip and Savour: Appetizers, Burgers with Fries, Steaks and Drinks",
      store: "Havana",
      location: "412 North Clark Street, Chicago",
      image: "reklama.jpg",
      oldPrice: 29.02,
      newPrice: 19,
      discount: 41,
      rating: 4.8,
      reviews: 76
    },
    {
      title: "Up to 63% Off Meal Delivery from Factor",
      store: "Factor",
      location: "Online Offer",
      image: "reklama.jpg",
      oldPrice: 110.91,
      newPrice: 45,
      discount: 63,
      rating: 4.2,
      reviews: 3964
    },
    {
      title: "Taste of Illinois' Comfort Food: $40, $70 and $100",
      store: "S2 Grill",
      location: "5058 South Halsted Street, Chicago",
      image: "reklama.jpg",
      oldPrice: 40,
      newPrice: 25,
      discount: 38,
      rating: 4.5,
      reviews: 120
    }
  ];
}
