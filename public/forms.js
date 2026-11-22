document.addEventListener('submit',async event=>{
  const form=event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('[data-async]')) return;
  event.preventDefault();
  if (form.dataset.busy) return;
  const message=form.querySelector('[role=alert]');
  const submit=form.querySelector('button[type=submit]');
  message.hidden=true;
  form.dataset.busy='true';
  submit.disabled=true;
  try {
    const response=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new FormData(form)});
    const result=await response.json().catch(()=>({error:response.status===401?'La sesión venció. Vuelve a ingresar.':'No se pudo procesar la solicitud.'}));
    if (response.ok && result.next) {location.assign(result.next);return;}
    message.textContent=result.error;
    message.hidden=false;
    message.focus();
  } catch {
    message.textContent='Se interrumpió la conexión. Revisa la página antes de repetir la operación.';
    message.hidden=false;
    message.focus();
  } finally {delete form.dataset.busy;submit.disabled=false;}
});
