import { documentDownload } from '../../../../lib/projects.mjs';
import { id } from '../../../../lib/rules.mjs';
import { feedback, fileResponse } from '../../../../lib/http.mjs';
export async function GET(context) {
  try {return fileResponse(await documentDownload(id(context.params.proyecto),id(context.params.documento),context.locals.account));}
  catch(error){return feedback(context,error);}
}
