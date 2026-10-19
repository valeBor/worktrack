import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (

  req,
  next

) => {

  // Evitar el acceso a localStorage durante SSR.
  if (typeof window === 'undefined') {

    return next(req);

  }

  const token =
    localStorage.getItem('token');

  // Si no hay token, continuar sin Authorization.
  if (!token) {

    return next(req);

  }

  const clonedRequest =
    req.clone({

      setHeaders: {

        Authorization:
          `Bearer ${token}`

      }

    });

  return next(clonedRequest);

};