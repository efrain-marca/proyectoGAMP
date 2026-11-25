(() => {
  if (window.mapaMunicipalInicializado) return;
  window.mapaMunicipalInicializado = true;
  const roots = [...document.querySelectorAll('[data-geo]')];
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  css.crossOrigin = 'anonymous';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.append(css);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.crossOrigin = 'anonymous';
  script.onload = () => roots.forEach(iniciar);
  script.onerror = () => roots.forEach(root => {
    if (root.dataset.edit==='1') {
      root.querySelector('[data-status]').textContent='Mapa sin conexión. Ingresá la dirección y, si las conocés, ambas coordenadas.';
      return;
    }
    root.querySelector('[data-status]').textContent = 'El mapa no está disponible. Consulta la dirección en la ficha.';
  });
  document.head.append(script);

  function iniciar(root) {
    const editar = root.dataset.edit === '1';
    const ubicacion = root.closest('form')?.elements.ubicacion;
    const latitud = root.querySelector('[name=latitud]');
    const longitud = root.querySelector('[name=longitud]');
    const estado = root.querySelector('[data-status]');
    const seleccion = root.dataset.lat !== '' && root.dataset.lon !== '';
    const centro = seleccion ? [+root.dataset.lat,+root.dataset.lon] : [-19.5836,-65.7531];
    const mapa = L.map(root.querySelector('[data-map]'),{scrollWheelZoom:false}).setView(centro,seleccion?16:14);
    const calles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19
    }).addTo(mapa);
    const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
      attribution:'Imágenes © Esri, Maxar, Earthstar Geographics y colaboradores',maxZoom:19
    });
    L.control.layers({Calles:calles,Satélite:satelite}).addTo(mapa);
    let marca, consulta;
    const marcar = (lat,lon) => {
      if (!marca) marca=L.circleMarker([lat,lon],{radius:9,color:'#fff',weight:3,fillColor:'#aa3519',fillOpacity:1}).addTo(mapa);
      else marca.setLatLng([lat,lon]);
    };
    if(seleccion) marcar(...centro);
    new ResizeObserver(()=>mapa.invalidateSize()).observe(root.querySelector('[data-map]'));
    if (!editar) {
      if (!seleccion) {
        estado.textContent='Ubicación registrada: '+root.dataset.direccion+'. Aún no se ha marcado el punto exacto.';
        const localizar=document.createElement('a');
        localizar.href='https://www.openstreetmap.org/search?query='+encodeURIComponent(root.dataset.direccion+', Potosí, Bolivia');
        localizar.textContent='Buscar esta dirección en OpenStreetMap';
        localizar.target='_blank';
        localizar.rel='noopener';
        root.querySelector('[data-results]').append(localizar);
      }
      return;
    }
    const resultados = root.querySelector('[data-results]');
    const buscar = root.querySelector('[data-query]');
    function direccion(feature) {
      const p = feature?.properties || {};
      return [...new Set([p.name,[p.street,p.housenumber].filter(Boolean).join(' '),p.district,p.city,p.state,p.country].filter(Boolean))].join(', ');
    }
    function elegir(lat,lon,nombre) {
      consulta?.abort();
      marcar(lat,lon);
      latitud.value=lat.toFixed(6);
      longitud.value=lon.toFixed(6);
      ubicacion.value=(nombre || (latitud.value+', '+longitud.value)).slice(0,150);
      resultados.replaceChildren();
      estado.textContent='Ubicación seleccionada. Podés ajustar la dirección antes de guardar.';
    }
    async function consultar(ruta, parametros, recibir) {
      consulta?.abort();
      const actual=new AbortController();
      consulta=actual;
      estado.textContent='Consultando el mapa…';
      try {
        const respuesta=await fetch('https://photon.komoot.io/'+ruta+'/?'+new URLSearchParams(parametros),{signal:actual.signal});
        if (!respuesta.ok) throw Error();
        const data=await respuesta.json();
        if (!actual.signal.aborted) recibir(data.features || []);
      } catch {
        if (!actual.signal.aborted) estado.textContent='El servicio de direcciones no respondió. Podés seleccionar el punto y escribir la dirección.';
      }
    }
    mapa.on('click',({latlng})=>{
      const {lat,lng}=latlng.wrap();
      elegir(lat,lng);
      const anterior=ubicacion.value;
      consultar('reverse',{lat,lon:lng},features=>{
        if(ubicacion.value===anterior && direccion(features[0])) ubicacion.value=direccion(features[0]).slice(0,150);
        estado.textContent='Punto seleccionado. Revisá la dirección antes de guardar.';
      });
    });
    function buscarLugar() {
      const q=buscar.value.trim();
      resultados.replaceChildren();
      if(!q) return;
      consultar('api',{q,lat:mapa.getCenter().lat,lon:mapa.getCenter().lng,limit:5},features=>{
        estado.textContent=features.length?'Elegí una coincidencia.':'No se encontraron coincidencias. Podés marcar el lugar directamente.';
        for(const feature of features){
          const btn=document.createElement('button');
          btn.type='button';btn.className='button line';btn.textContent=direccion(feature);
          btn.onclick=()=>{
            const [lon,lat]=feature.geometry.coordinates;
            elegir(lat,lon,btn.textContent);
            mapa.setView([lat,lon],17);
          };
          resultados.append(btn);
        }
      });
    }
    root.querySelector('[data-search]').onclick=buscarLugar;
    buscar.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();buscarLugar();}};
    for(const field of [latitud,longitud]) field.addEventListener('input',()=>{
      consulta?.abort();
      if(latitud.value && longitud.value && latitud.validity.valid && longitud.validity.valid){
        marcar(+latitud.value,+longitud.value);
        mapa.panTo([+latitud.value,+longitud.value]);
      } else if(marca){marca.remove();marca=null;}
    });
  }
})();
