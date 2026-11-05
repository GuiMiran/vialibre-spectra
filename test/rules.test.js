import {test} from 'node:test';
import assert from 'node:assert/strict';
import {level,arrival,position,upperMedian} from '../public/rules.js';
import {base,network,snapshot} from '../public/demo.js';


test('AC-004 boundaries include 5 and 15 minutes',()=>{
  assert.deepEqual([-2,0,4,5,14,15].map(level),['ok','ok','ok','leve','leve','grave']);
});
test('AC-005 arrival crosses midnight',()=>{
  assert.equal(arrival('23:55',15),'00:10');
  assert.equal(arrival('23:55',Math.max(0,-2)),'23:55');
});
test('AC-007 extrapolation clamps clock skew and stale observations',()=>{
  const train={x:400,y:250,vx:2,vy:0,ts:100000};
  assert.deepEqual(position(train,99000),[400,250]);
  assert.deepEqual(position(train,110000),[420,250]);
  assert.deepEqual(position(train,161000),[520,250]);
  assert.deepEqual(position(train,110000,true),[400,250]);
});
test('AC-010 upper median preserves reference behaviour for even fleets',()=>{
  assert.equal(upperMedian([0,10]),10);
  assert.equal(upperMedian([]),0);
  assert.equal(upperMedian([-2,0,5]),0);
});
test('demo snapshots are deterministic, consistent and explicitly synthetic',()=>{
  const now=Date.UTC(2026,10,5,12);
  const data=snapshot(now);
  assert.deepEqual(data,snapshot(now));
  assert.equal(data.simulado,true);
  assert.equal(new Set(data.trenes.map(t=>t.n)).size,65);
  for (const t of data.trenes) {
    for (const code of [t.ori,t.des,t.ant,t.sig]) assert.ok(data.est[code]);
    for (const value of [t.x,t.y,t.vx,t.vy,t.ts]) assert.ok(Number.isFinite(value));
  }
  assert.equal(now-Date.parse(snapshot(now,'stale').fuentes.renfe.hora),240000);
  assert.ok(base.land.esp.startsWith('M'));
  assert.ok(network.every(segment=>segment.length===4&&segment.every(Number.isFinite)));
});
