// Synthetic data provider. Coordinates are an illustrative SVG plane.
// @spectra OP-001 OP-002 OP-003
const cities = [
  ['60000','Madrid',470,395,'MADRID'],
  ['71801','Barcelona',865,300,'BARCELONA'],
  ['04040','Zaragoza',685,280,'ZARAGOZA'],
  ['03216','València',700,505,'VALENCIA'],
  ['51003','Sevilla',335,675,'SEVILLA'],
  ['54413','Málaga',450,745,'MALAGA'],
  ['50500','Córdoba',425,635,'CORDOBA'],
  ['31412','A Coruña',150,100,'A CORUNA'],
  ['08223','Vigo',120,230,'PONTEVEDRA'],
  ['15100','León',350,205,'LEON'],
  ['15211','Oviedo',360,105,'ASTURIAS'],
  ['11511','San Sebastián',595,135,'GUIPUZCOA'],
  ['60911','Alicante',670,625,'ALICANTE'],
  ['04307','Figueres',915,220,'GIRONA'],
  ['04104','Tarragona',815,350,'TARRAGONA'],
  ['08004','Segovia',420,330,'SEGOVIA'],
  ['60600','Albacete',585,535,'ALBACETE'],
  ['03208','Cuenca',575,445,'CUENCA'],
  ['04007','Guadalajara',535,350,'GUADALAJARA'],
  ['02000','Valladolid',380,280,'VALLADOLID'],
  ['03000','Bilbao',525,140,'BIZKAIA'],
  ['04000','Granada',520,690,'GRANADA'],
  ['05000','Badajoz',230,540,'BADAJOZ'],
  ['06000','Murcia',625,665,'MURCIA']
];
const stations = Object.fromEntries(cities.map(([code,n,x,y,prov]) => [code,{n,x,y,prov}]));
const routes = [
  ['60000','04007','04040','04104','71801','04307'],
  ['60000','03208','60600','03216'],
  ['60000','50500','51003'],
  ['60000','50500','54413'],
  ['60000','08004','02000','15100','31412'],
  ['60000','08004','02000','15100','15211'],
  ['31412','08223'],
  ['60000','08004','02000','03000','11511'],
  ['71801','04104','03216','60911','06000'],
  ['60000','03208','60600','60911'],
  ['51003','50500','04000'],
  ['60000','05000'],
  ['04040','11511']
];

export const base = {
  land: {
    esp:'M90,80L175,55L260,80L345,75L440,95L520,105L610,110L650,145L730,175L790,180L850,195L905,170L950,190L935,255L905,280L890,330L840,385L790,405L750,460L735,505L715,555L700,620L665,680L615,710L565,735L500,750L450,775L390,770L345,745L315,700L290,665L245,650L215,610L190,575L205,530L200,485L225,445L240,380L210,340L225,295L205,260L170,250L135,265L100,245L90,200L75,160L95,130Z',
    prt:'M100,245L170,250L205,260L225,295L210,340L240,380L225,445L200,485L205,530L190,575L155,610L95,605L65,560L80,480L85,390L95,315Z',
    fra:'M610,110L650,145L730,175L790,180L850,195L905,170L950,190L1030,80L1030,-70L650,-70Z',
    and:'M865,174L873,171L880,178L876,183Z',
    mar:'M260,860L390,820L490,835L650,850L700,950L250,950Z'
  },
  corr: routes.map(route => route.map(code => [stations[code].x,stations[code].y])),
  principales: cities.map(([,n,x,y]) => ({n,x,y}))
};
export const network = routes.flatMap(route => route.slice(1).map((code,index) => [stations[route[index]].x,stations[route[index]].y,stations[code].x,stations[code].y]));
const products = [2,25,28,3,11,10,13,16,18,19,20];
const delays = [-2,0,0,4,5,8,12,14,15,18,22,31,46];
const epoch = Date.UTC(2026,0,1);

export function snapshot(now = Date.now(), scenario = 'normal') {
  const trains = Array.from({length:65},(_,i) => {
    const route = i % 2 ? [...routes[i % routes.length]].reverse() : routes[i % routes.length];
    const lengths = route.slice(1).map((code,j) => Math.hypot(stations[code].x-stations[route[j]].x,stations[code].y-stations[route[j]].y));
    const total = lengths.reduce((a,b)=>a+b,0);
    let distance = ((i*97 + (now-epoch)/1000*0.24) % total + total) % total;
    let segment = 0;
    while (segment < lengths.length-1 && distance > lengths[segment]) distance -= lengths[segment++];
    const from=stations[route[segment]], to=stations[route[segment+1]];
    const ratio=distance/lengths[segment];
    const speed=0.24;
    const arrivalTime=new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(now+((i%8)+1)*12*60000));
    return {n:String(1000+i).padStart(5,'0'),p:products[i%products.length],x:from.x+(to.x-from.x)*ratio,y:from.y+(to.y-from.y)*ratio,vx:(to.x-from.x)/lengths[segment]*speed,vy:(to.y-from.y)/lengths[segment]*speed,ts:now,ret:delays[i%delays.length],ori:route[0],des:route.at(-1),ant:route[segment],sig:route[segment+1],lleg:arrivalTime,hs:arrivalTime,kmh:i%11===0?0:180+(i*17)%121,acc:i%3===0};
  });
  const sourceTime = new Date(now-(scenario==='stale'?240000:0)).toISOString();
  return {simulado:true,trenes:trains,est:stations,incidencias:[],fuentes:{renfe:{ok:true,hora:sourceTime}},red:'demo-v1',generado:new Date(now).toISOString(),flotaHora:sourceTime,sinPosicion:0};
}

let scenario = 'normal';
export function setScenario(value) { scenario = value; }
export async function request(path) {
  if (new URLSearchParams(location.search).get('mode') !== 'demo') {
    return fetch(path, {signal:AbortSignal.timeout(8000)});
  }
  if (path === '/api/estado' && scenario === 'offline') throw new Error('Simulated connection failure');
  const payload = path === '/api/base' ? base : path === '/api/red' ? network : snapshot(Date.now(), scenario);
  return {ok:true,json:async()=>structuredClone(payload)};
}
