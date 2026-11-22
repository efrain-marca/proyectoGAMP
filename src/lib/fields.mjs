import {today} from './rules.mjs';
export const choice=(value,label)=>({value,label});
export const field=(name,label,options={})=>({name,label,...(name==='nombre'?{pattern:'\\p{L}+(?: +\\p{L}+)*',help:'Solo letras y espacios, incluidas tildes y ñ.'}:{}),...options});
export const select=(name,label,options,extra={})=>field(name,label,{type:'select',options,...extra});
export const date=(name,label,options={})=>field(name,label,{type:'date',...options});
export const check=(name,label,options={})=>field(name,label,{type:'checkbox',...options});
export const textarea=(name,label,maxLength,options={})=>field(name,label,{type:'textarea',wide:true,maxLength,...options});
export const reason=(required=true)=>textarea('motivo','Motivo',500,{minLength:5,required});
export const observation=()=>textarea('observacion','Observación',750,{minLength:5});
export const projectFields=(p={})=>[
  field('codigo','Código',{value:p.codigo,minLength:3,maxLength:30,placeholder:'POT-2026-001'}),
  field('nombre','Nombre del proyecto',{value:p.nombre,minLength:5,maxLength:160}),
  field('ubicacion','Ubicación',{value:p.ubicacion,minLength:3,maxLength:150}),
  field('unidad','Unidad responsable',{value:p.unidad,minLength:3,maxLength:120}),
  date('inicio','Inicio previsto',{value:p.inicio||today(),min:p.inicio?undefined:today()}),
  date('fin','Fin previsto',{value:p.fin,min:p.fin?undefined:today()}),
  textarea('descripcion','Descripción interna',1600,{value:p.descripcion,minLength:10}),
];
