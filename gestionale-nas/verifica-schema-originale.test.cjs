'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verify,TABLES,FIELDS,RECEIPT_TRIGGERS}=require('./verifica-schema-originale.js');
test('preflight non esegue mai query di scrittura e segnala tabelle mancanti',async()=>{
 const queries=[];
 const pool={async query(sql,args){
   queries.push({sql,args});
   if(sql.includes('information_schema.columns'))return {rows:args[0]==='soci'?FIELDS.soci.map(column_name=>({column_name})):[]};
   return {rows:[{n:2}]};
 }};
 const report=await verify(pool);
 assert.equal(report.ok,false);
 assert.equal(report.tables.length,TABLES.length);
 assert.equal(report.tables[0].count,2);
 assert.ok(report.tables[1].missing.includes('anno'));
 assert.ok(queries.every(x=>/^SELECT /i.test(x.sql.trim())));
});
test('preflight segnala schema compatibile quando tutti i campi minimi esistono',async()=>{
 const pool={async query(sql,args){
   if(sql.includes('information_schema.columns'))return {rows:FIELDS[args[0]].map(column_name=>({column_name}))};
   if(sql.includes('pg_trigger'))return {rows:RECEIPT_TRIGGERS.map(tgname=>({tgname}))};
   return {rows:[{n:0}]};
 }};
 const report=await verify(pool);
 assert.equal(report.ok,true);
 assert.equal(report.tables.length,9);
});

test('preflight blocca ricevute senza trigger di numerazione e immutabilità',async()=>{
 const pool={async query(sql,args){
   if(sql.includes('information_schema.columns'))return {rows:FIELDS[args[0]].map(column_name=>({column_name}))};
   if(sql.includes('pg_trigger'))return {rows:[]};
   return {rows:[{n:0}]};
 }};
 const report=await verify(pool);
 assert.equal(report.ok,false);
 assert.deepEqual(report.missingReceiptTriggers,RECEIPT_TRIGGERS);
});
