import base from '../../../lib/data/base.json';
import network from '../../../lib/data/network.json';
import metadata from '../../../lib/data/metadata.json';
import {FEEDS,createFeedLoader,normalize} from '../../../lib/renfe.js';

const load=createFeedLoader();
export async function GET(_request:Request,context:{params:Promise<{kind:string}>}) {
  const {kind}=await context.params;
  const headers={'Cache-Control':'no-store'};
  if (kind==='base') return Response.json(base,{headers});
  if (kind==='red') return Response.json(network,{headers});
  if (kind!=='estado') return Response.json({error:'No encontrado'},{status:404});
  const [positions,updates]=await Promise.allSettled([load(FEEDS.positions),load(FEEDS.updates)]);
  if (positions.status==='rejected') return Response.json({error:'No se pudo consultar la fuente de posiciones de Renfe',cause:String(positions.reason?.message || 'Unavailable')},{status:502,headers});
  return Response.json(normalize(positions.value,updates.status==='fulfilled'?updates.value:null,metadata),{headers});
}
