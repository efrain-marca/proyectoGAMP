import { reportFilters, loadReport } from '../../../lib/reports.mjs';
import { renderPdf } from '../../../lib/pdf.mjs';
import { feedback } from '../../../lib/http.mjs';
export async function GET(context) {
  try {
    const filter=reportFilters(context.url.searchParams);
    const report=await loadReport(context.locals.account,filter);
    const pdf=renderPdf(report);
    return new Response(pdf,{headers:{'Content-Type':'application/pdf','Content-Length':String(pdf.length),'Content-Disposition':'attachment; filename="informe-'+filter.type+'-'+filter.cut+'.pdf"'}});
  } catch(error) {return feedback(context,error);}
}
