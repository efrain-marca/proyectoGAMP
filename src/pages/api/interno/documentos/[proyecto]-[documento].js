import { documentDownload } from '../../../../lib/projects.mjs';
import { id } from '../../../../lib/rules.mjs';
import { feedback, fileResponse } from '../../../../lib/http.mjs';
export async function GET(context) {
  try {const file=await documentDownload(id(context.params.proyecto),id(context.params.documento),context.locals.account);
    const response=fileResponse(file);
    if (context.url.searchParams.get('vista')==='imagen' && ['image/png','image/jpeg'].includes(file.tipo)) response.headers.set('Content-Disposition','inline');
    return response;
  }
  catch(error){return feedback(context,error);}
}
