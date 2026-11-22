import { createHash } from 'node:crypto';
import { Issue, insist } from './rules.mjs';

export async function readForm(context, max=32*1024) {
  const request=context.request;
  const origin=request.headers.get('origin');
  insist(origin && origin===context.url.origin,'La solicitud debe provenir de esta misma aplicación.',403);
  const type=request.headers.get('content-type')||'';
  insist(type.startsWith('multipart/form-data;') || type.startsWith('application/x-www-form-urlencoded'),'Formato de envío inválido.',415);
  if (Number(request.headers.get('content-length'))>max) throw new Issue('El formulario supera el tamaño permitido.',413);
  const chunks=[];
  let length=0;
  try {
    for await (const chunk of request.body) {
      length+=chunk.byteLength;
      if (length>max) throw new Issue('El formulario supera el tamaño permitido.',413);
      chunks.push(Buffer.from(chunk));
    }
    return await new Response(Buffer.concat(chunks),{headers:{'content-type':type}}).formData();
  } catch (error) {
    if (error instanceof Issue) throw error;
    throw new Issue('No se pudo leer el formulario.',400);
  }
}
export function problem(error) {
  if (error instanceof Issue) return error;
  console.error('Error municipal:',error.message.slice(0,100).replace(/[\r\n]/g,' '));
  return new Issue('No se pudo completar la solicitud. Comprueba que la base de datos esté disponible o inténtalo más tarde.',503);
}
export function feedback(context,error,back) {
  const issue=problem(error);
  if (context.request.headers.get('accept')?.includes('application/json')) {
    return Response.json({error:issue.message},{status:issue.status});
  }
  if (back) {
    context.cookies.set('pm_msg',encodeURIComponent(issue.message),{path:'/',httpOnly:true,sameSite:'lax',maxAge:30,secure:process.env.COOKIE_SECURE==='true'});
    return context.redirect(back,303);
  }
  return new Response(issue.message,{status:issue.status,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
export function flash(context) {
  const raw=context.cookies.get('pm_msg')?.value;
  if (!raw) return '';
  context.cookies.delete('pm_msg',{path:'/'});
  try {return decodeURIComponent(raw);} catch {return '';}
}
export function fileResponse(file) {
  insist(file.data.length===Number(file.bytes) && createHash('sha256').update(file.data).digest('hex')===file.sha,'El archivo no está disponible.',404);
  return new Response(file.data,{headers:{'Content-Type':file.tipo,'Content-Length':String(file.bytes),'Cache-Control':'no-store',
    'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(file.nombre).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}});
}
