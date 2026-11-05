// @spectra OP-003 BR-005. GTFS-RT seconds are converted to milliseconds/minutes.
export const FEEDS = Object.freeze({
  positions:'https://gtfsrt.renfe.com/vehicle_positions_LD.json',
  updates:'https://gtfsrt.renfe.com/trip_updates_LD.json'
});
const products={'AVE':2,'AVE INT':2,'AVLO':28,'AVANT':3,'AVANT EXP':3,'ALVIA':11,'EUROMED':10,'Intercity':13,'MD':16,'REGIONAL':18,'REG.EXP.':19,'PROXIMDAD':16};
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const timestamp=value=>finite(value)&&Number(value)>0?Number(value)*1000:null;
const localTime=ms=>ms?new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(ms)):null;
const plannedTime = value => {
  if (!value) return null;
  const [hour,minute] = value.split(':').map(Number);
  return Number.isFinite(hour)&&Number.isFinite(minute) ? `${String(hour%24).padStart(2,'0')}:${String(minute).padStart(2,'0')}` : null;
};
export const project=(lon,lat)=>[(lon+9.8)*70,(44.1-lat)*95];

export function normalize(positions,updates,metadata,now=Date.now()) {
  const updated=new Map((updates?.entity||[]).filter(e=>e.tripUpdate?.trip?.tripId).map(e=>[e.tripUpdate.trip.tripId,e.tripUpdate]));
  const byNumber=new Map();
  let noPosition=0;
  const headerTime=timestamp(positions.header?.timestamp);
  const updateTime=timestamp(updates?.header?.timestamp);
  for (const entity of positions.entity||[]) {
    const v=entity.vehicle;
    if (!v) continue;
    const p=v.position;
    if (!p||!finite(p.latitude)||!finite(p.longitude)||Math.abs(Number(p.latitude))>90||Math.abs(Number(p.longitude))>180) {noPosition++;continue;}
    const tripId=v.trip?.tripId;
    const trip=metadata.trips[tripId];
    const update=updated.get(tripId);
    if (update?.trip?.scheduleRelationship==='CANCELED') continue;
    const number=String(v.vehicle?.label||trip?.n||v.vehicle?.id||tripId||entity.id);
    const stops=trip?.stops||[];
    const nextUpdate=update?.stopTimeUpdate?.find(s=>s.stopId===v.stopId)||update?.stopTimeUpdate?.[0];
    const delaySeconds=finite(update?.delay)?Number(update.delay):finite(nextUpdate?.arrival?.delay)?Number(nextUpdate.arrival.delay):null;
    const stopIndex=stops.findIndex(s=>s[0]===v.stopId);
    const atStop=v.currentStatus==='STOPPED_AT';
    const next=v.stopId||nextUpdate?.stopId||null;
    const routeConflict=!!(trip&&next&&stopIndex<0);
    const verifiedStops=routeConflict?[]:stops;
    const previous=atStop?next:stopIndex>0?stops[stopIndex-1][0]:null;
    const [x,y]=project(Number(p.longitude),Number(p.latitude));
    const observation=timestamp(v.timestamp)||headerTime;
    const train={n:number,p:products[trip?.product]||0,producto:trip?.product||'Sin clasificar',x,y,vx:0,vy:0,ts:observation,
      ret:delaySeconds===null?null:Math.round(delaySeconds/60),retFecha:updateTime,
      ori:verifiedStops[0]?.[0]||null,des:verifiedStops.at(-1)?.[0]||null,ant:previous,sig:next,
      lleg:plannedTime(verifiedStops.at(-1)?.[1]),
      hs:localTime(timestamp(nextUpdate?.arrival?.time)),
      kmh:finite(p.speed)&&Number(p.speed)>=0?Math.round(Number(p.speed)*3.6):null,
      routeConflict,acc:trip?.accessible||false,tripId,source:'Renfe GTFS-RT',lat:Number(p.latitude),lon:Number(p.longitude)};
    const old=byNumber.get(number);
    if (!old||(train.ts||0)>=(old.ts||0)) byNumber.set(number,train);
  }
  const trains=[...byNumber.values()];
  return {simulado:false,trenes:trains,est:metadata.stations,incidencias:[],red:'gtfs-'+metadata.gtfsSha256.slice(0,12),
    generado:new Date(now).toISOString(),flotaHora:headerTime?new Date(headerTime).toISOString():null,
    fuentes:{renfe:{ok:true,hora:headerTime?new Date(headerTime).toISOString():null},retrasos:{ok:!!updates,hora:updateTime?new Date(updateTime).toISOString():null}},
    sinPosicion:noPosition,sinRetraso:trains.filter(t=>t.ret===null).length,
    metadataGenerada:metadata.generatedAt,datosAviso:updates?null:'La fuente de retrasos no responde. Se muestran solo las posiciones disponibles.'};
}

export function createFeedLoader(fetchImpl=fetch,clock=Date.now) {
  const cache=new Map();
  const pending=new Map();
  return async function load(url) {
    const saved=cache.get(url);
    if (saved&&clock()-saved.fetched<15000) return saved.data;
    if (pending.has(url)) return pending.get(url);
    const task=(async()=>{
      const response=await fetchImpl(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Renfe HTTP '+response.status);
      const data=await response.json();
      if (!data?.header||('entity' in data&&!Array.isArray(data.entity))) throw new Error('Invalid GTFS-RT');
      cache.set(url,{fetched:clock(),data});
      return data;
    })();
    pending.set(url,task);
    try {return await task;} finally {pending.delete(url);}
  };
}
