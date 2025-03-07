import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  template: `<h2>Deal Detail</h2><p>Details of the deal.</p>`
})
export class DealDetailComponent {
  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      console.log('Deal ID:', params['id']);
    });
  }
}
