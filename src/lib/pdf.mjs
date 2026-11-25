import { dateLabel, states } from './rules.mjs';

const cp1252=new Map([['€',128],['…',133],['‘',145],['’',146],['“',147],['”',148],['–',150],['—',151],['→',62]]);
function safe(text) {
  return Array.from(String(text).replace(/\s+/g,' ').trim()).map(c=>{
    const code=cp1252.get(c) ?? c.codePointAt(0);
    if (code===40||code===41||code===92) return '\\'+String.fromCharCode(code);
    if (code>126 && code<=255) return '\\'+code.toString(8).padStart(3,'0');
    return code>=32&&code<=126?String.fromCharCode(code):'?';
  }).join('');
}
function wrap(text,width) {
  const lines=[];
  const words=String(text).trim().replace(/\s+/g,' ').split(' ').flatMap(word=>word.length>width?(word.match(new RegExp('.{1,'+width+'}','gu'))||[]):[word]);
  let line='';
  for (const word of words) {
    if (line.length && line.length+word.length+1>width) { lines.push(line); line=''; }
    line+=(line?' ':'')+word;
  }
  if (line) lines.push(line);
  return lines;
}
export function renderPdf(report) {
  const ink='0.055 0.14 0.16', secondary='0.25 0.34 0.36', green='0.07 0.35 0.31';
  const pages=[];
  let ops,y,activeProject,activeSection;
  function rect(x,top,w,h,color) { ops.push(color+' rg '+x+' '+(842-top-h)+' '+w+' '+h+' re f'); }
  function line(text,x,top,size,bold=false,color=ink) {
    ops.push('BT '+color+' rg /'+(bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x+' '+(842-top)+' Tm ('+safe(text)+') Tj ET');
  }
  function newPage() {
    ops=[];pages.push(ops);
    rect(0,0,595,91,ink);rect(42,28,32,4,'0.67 0.85 0.37');
    line('SEGUIMIENTO MUNICIPAL · POTOSÍ',42,48,10,true,'0.82 0.91 0.82');
    line(report.title,42,73,21,true,'1 1 1');
    y=115;
    if (activeProject) {
      line(activeProject+' · Continuación',42,y,9,true,secondary);
      y+=15;
    }
    if (activeSection) {
      line(activeSection,49,y,10,true,green);
      y+=16;
    }
  }
  function ensure(height) { if (y+height>781) newPage(); }
  function para(text,x,size,bold,width,step,color) {
    for (const segment of wrap(text,width)) { ensure(step); line(segment,x,y,size,bold,color); y+=step; }
  }
  newPage();
  para('Fecha de corte '+dateLabel(report.filters.cut)+'  ·  Emisión '+report.issued,42,10,true,90,15,ink);
  para('Emitido por '+report.issuer+(report.directory?'':'  ·  '+(report.filters.hasFrom?'Desde '+dateLabel(report.filters.from):'Todos los periodos')+'  ·  '+(report.filters.state?states[report.filters.state]:'Todos los estados')),42,9,false,98,14,secondary);
  if (report.filters.project && report.documents.length) para('Proyecto seleccionado · '+report.documents[0].name,42,9,false,98,14,secondary);
  if (!report.documents.length) para('No se encontraron proyectos para los filtros seleccionados.',42,11,false,80,18,ink);
  for (const project of report.documents) {
    activeProject=null;activeSection=null;
    y+=12;ensure(63);activeProject=project.code;rect(42,y-12,511,25,'0.90 0.95 0.92');
    para(project.code+' · '+project.name,51,12,true,73,18,ink);
    para(project.meta,51,9,false,96,13,secondary);
    for (const section of project.sections) {
      activeSection=null;
      y+=8;
      const first=section.entries[0];
      ensure(first?Math.min(98,21+wrap(first.title,92).length*13+first.details.slice(0,3).reduce((n,detail)=>n+wrap(detail,97).length*11,0)):35);
      activeSection=section.title;
      para(section.title,49,11,true,81,15,green);
      if (!section.entries.length) { para('Sin registros para el filtro seleccionado.',57,9,false,97,13,secondary);continue; }
      for (const item of section.entries) {
        const height=wrap(item.title,92).length*13+item.details.reduce((n,detail)=>n+wrap(detail,97).length*11,0);
        ensure(Math.min(height+4,114));
        para(item.title,57,9.5,true,92,13,ink);
        for (const detail of item.details) para(detail,57,9,false,97,11,secondary);
        y+=5;
      }
    }
  }
  pages.forEach((page,index)=>{
    ops=page;
    rect(42,798,511,1,'0.80 0.84 0.83');
    line('Sistema de Seguimiento de Proyectos Municipales',42,816,8,false,secondary);
    line('Página '+(index+1)+' de '+pages.length,478,816,8,false,secondary);
  });
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  const children=[];
  for (const page of pages) {
    const pageId=objects.length+1, stream=page.join('\n')+'\n';
    children.push(pageId+' 0 R');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+(pageId+1)+' 0 R >>');
    objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream');
  }
  objects[1]='<< /Type /Pages /Count '+pages.length+' /Kids ['+children.join(' ')+'] >>';
  let pdf='%PDF-1.4\n';
  const offsets=[];
  objects.forEach((body,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=(index+1)+' 0 obj\n'+body+'\nendobj\n';});
  const xref=Buffer.byteLength(pdf);
  pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+
    'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Buffer.from(pdf);
}
