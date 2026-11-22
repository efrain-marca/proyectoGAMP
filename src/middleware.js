import { defineMiddleware } from 'astro:middleware';
import { viewer } from './lib/auth.mjs';
export const onRequest=defineMiddleware(async (context,next)=>{
  const path=context.url.pathname;
  if (path==='/ingresar' || path.startsWith('/app/') || path==='/app' || path.startsWith('/api/interno/')) {
    try { context.locals.account=await viewer(context); }
    catch { return new Response('Base de datos temporalmente no disponible. Comprueba la configuración de XAMPP.',{status:503}); }
    if ((path==='/app' || path.startsWith('/app/')) && !context.locals.account) return context.redirect('/ingresar',303);
    if (path.startsWith('/api/interno/') && !context.locals.account) return new Response('Inicia sesión.',{status:401});
  }
  const response=await next();
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','same-origin');
  headers.set('X-Frame-Options','DENY');
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
});
