import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (

  req,
  next

) => {

  // evitar SSR
  if (typeof window === 'undefined') {

    return next(req);

  }

  const token = localStorage.getItem('token');

  console.log('TOKEN INTERCEPTOR:', token);

  // si no hay token
  if (!token) {

    return next(req);

  }

  const clonedRequest = req.clone({

    setHeaders: {

      Authorization: `Bearer ${token}`

    }

  });

  return next(clonedRequest);

};