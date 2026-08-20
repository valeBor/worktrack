import {
  RenderMode,
  ServerRoute
} from '@angular/ssr';


export const serverRoutes: ServerRoute[] = [

  // ====================================================
  // RECUPERAR CONTRASEÑA
  // ====================================================
  //
  // Esta ruta contiene un token dinámico enviado
  // por correo.
  //
  // No puede generarse previamente porque Angular
  // no conoce el token durante la compilación.
  //
  // Se renderiza en el navegador.
  // ====================================================

  {

    path: 'reset-password/:token',

    renderMode: RenderMode.Client

  },


  // ====================================================
  // RESTO DE LAS RUTAS
  // ====================================================

  {

    path: '**',

    renderMode: RenderMode.Prerender

  }

];