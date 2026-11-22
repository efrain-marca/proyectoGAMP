import { mutate } from '../../../lib/mutations.mjs';
import { feedback, readForm } from '../../../lib/http.mjs';
export async function POST(context) {
  const account=context.locals.account;
  let form;
  try {
    form=await readForm(context,10*1024*1024+32768);
    const next=await mutate(context,account,form);
    if (context.request.headers.get('accept')?.includes('application/json')) return Response.json({next});
    return context.redirect(next,303);
  } catch(error) {
    const candidate=form?.get('volver');
    const back=typeof candidate==='string' && /^\/app(?:\/(?:usuarios|proyectos(?:\/[0-9]+)?))?(?:\?vista=[a-z]+)?$/.test(candidate)?candidate:'/app';
    return feedback(context,error,back);
  }
}
