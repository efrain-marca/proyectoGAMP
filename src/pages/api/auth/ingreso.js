import { login } from '../../../lib/auth.mjs';
import { feedback, readForm } from '../../../lib/http.mjs';
export async function POST(context) {
  try {
    await login(context,await readForm(context));
    if (context.request.headers.get('accept')?.includes('application/json')) return Response.json({next:'/app'});
    return context.redirect('/app',303);
  } catch (error) {return feedback(context,error,'/ingresar');}
}
