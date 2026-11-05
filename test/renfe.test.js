import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalize,createFeedLoader,project} from '../lib/renfe.js';
import {level,upperMedian} from '../public/rules.js';

const meta={gtfsSha256:'0123456789abcdef',generatedAt:'2026-11-05T00:00:00Z',stations:{a:{n:'Origen'},b:{n:'Destino'}},trips:{t:{n:'00123',product:'AVE',stops:[['a','8:30:00'],['b','25:05:00']],accessible:true}}};
const now=1800000000000;
const positions={header:{timestamp:now/1000-240},entity:[{id:'v',vehicle:{trip:{tripId:'t'},vehicle:{label:'00123'},position:{latitude:40,longitude:-3,speed:50},stopId:'b',currentStatus:'IN_TRANSIT_TO'}}]};
const updates={header:{timestamp:now/1000},entity:[{tripUpdate:{trip:{tripId:'t'},delay:0,stopTimeUpdate:[{stopId:'b',arrival:{time:now/1000+60,delay:0}}]}}]};

test('real normalization preserves source age, zero delay, units and leading zeros',()=>{
  const state=normalize(positions,updates,meta,now);
  assert.equal(state.simulado,false);
  assert.equal(state.trenes.length,1);
  const t=state.trenes[0];
  assert.equal(t.n,'00123');
  assert.equal(t.ret,0);
  assert.equal(t.kmh,180);
  assert.equal(t.lleg,'01:05');
  assert.equal(t.ts,now-240000);
  assert.equal(state.fuentes.renfe.hora,new Date(now-240000).toISOString());
  assert.deepEqual([t.x,t.y],project(-3,40));
  assert.deepEqual([t.vx,t.vy],[0,0]);
});
test('missing delay stays unknown and never contributes a zero to the median',()=>{
  const state=normalize(positions,null,meta,now);
  assert.equal(state.trenes[0].ret,null);
  assert.equal(state.sinRetraso,1);
  assert.equal(state.fuentes.retrasos.ok,false);
  assert.equal(level(null),'info');
  assert.equal(upperMedian([null,10,20]),20);
});
test('missing schedule metadata preserves GPS with unclassified product',()=>{
  const state=normalize(positions,updates,{...meta,trips:{}},now);
  assert.equal(state.trenes.length,1);
  assert.equal(state.trenes[0].p,0);
  assert.equal(state.trenes[0].ori,null);
  assert.equal(state.trenes[0].lleg,null);
});
test('invalid GPS and explicit cancellations do not generate markers',()=>{
  const invalid=structuredClone(positions);invalid.entity[0].vehicle.position.latitude=100;
  assert.equal(normalize(invalid,updates,meta,now).sinPosicion,1);
  assert.equal(normalize(invalid,updates,meta,now).trenes.length,0);
  const canceled=structuredClone(updates);canceled.entity[0].tripUpdate.trip.scheduleRelationship='CANCELED';
  assert.equal(normalize(positions,canceled,meta,now).trenes.length,0);
});
test('negative delay in seconds converts to minutes without guessing absent speed',()=>{
  const u=structuredClone(updates);u.entity[0].tripUpdate.delay=-120;
  const p=structuredClone(positions);delete p.entity[0].vehicle.position.speed;
  const t=normalize(p,u,meta,now).trenes[0];
  assert.equal(t.ret,-2);assert.equal(t.kmh,null);
});
test('cache deduplicates concurrent upstream requests and expires at 15 seconds',async()=>{
  let calls=0,time=0;
  const load=createFeedLoader(async()=>{calls++;return {ok:true,json:async()=>positions}},()=>time);
  await Promise.all([load('source'),load('source')]);
  assert.equal(calls,1);
  time=14999;await load('source');assert.equal(calls,1);
  time=15000;await load('source');assert.equal(calls,2);
});
test('failed upstream loads reject and retry without substituting mock data',async()=>{
  let calls=0;
  const load=createFeedLoader(async()=>{calls++;return {ok:calls>1,status:503,json:async()=>positions}});
  await assert.rejects(load('source'),/503/);
  assert.deepEqual(await load('source'),positions);
  assert.equal(calls,2);
});

test('a stop outside the scheduled route is flagged and its itinerary withheld',()=>{
  const p=structuredClone(positions);p.entity[0].vehicle.stopId='outside';
  const t=normalize(p,updates,meta,now).trenes[0];
  assert.equal(t.routeConflict,true);assert.equal(t.ori,null);assert.equal(t.des,null);assert.equal(t.lleg,null);
  assert.equal(t.sig,'outside');assert.equal(t.ret,0);
});
