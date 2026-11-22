import { logout } from '../../../lib/auth.mjs';
import { feedback, readForm } from '../../../lib/http.mjs';
export async function POST(context) {
  try {await readForm(context);await logout(context); return context.redirect('/ingresar',303);}
  catch(error){return feedback(context,error,'/app');}
}
