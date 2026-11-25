import { rows } from '../../../lib/db.mjs';
import { roles, today } from '../../../lib/rules.mjs';
import { funciones } from '../../../lib/seguimiento.mjs';
import { renderPdf } from '../../../lib/pdf.mjs';
import { feedback } from '../../../lib/http.mjs';

export async function GET(context) {
  const account = context.locals.account;
  if (account?.rol !== 'admin') return new Response('Acceso restringido.',{status:403});
  try {
    const users = await rows('SELECT nombre,rol FROM usuarios ORDER BY nombre,id');
    const report = {
      title:'Informe de usuarios',directory:true,issuer:account.nombre,issued:today(),filters:{cut:today()},
      documents:[{
        code:'Directorio', name:'Usuarios municipales',meta:users.length+' cuentas registradas',
        sections:[{title:'Nombre, rol y funciones',entries:users.map(u=>({
          title:u.nombre, details:[roles[u.rol] || 'Rol anterior',funciones[u.rol] || 'Funciones pendientes de asignación.']
        }))}]
      }]
    };
    return new Response(renderPdf(report),{headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':'inline; filename="directorio-usuarios.pdf"'
    }});
  } catch(error) { return feedback(context,error); }
}
