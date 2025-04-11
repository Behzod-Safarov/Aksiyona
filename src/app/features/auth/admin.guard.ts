import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('userRole');

  if (role === 'admin') {
    return true;
  } else {
    router.navigate(['login']);
    return false;
  }
};