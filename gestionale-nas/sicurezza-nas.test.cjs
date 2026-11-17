'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSecurity}=require('./sicurezza-nas');
const origin='https://terramaster.tail668e01.ts.net:8443';
const security=createSecurity(origin);
function res(){return {statusCode:200,status(n){this.statusCode=n;return this},json(x){this.data=x;return this}}}
function req(headers={},session={}){return {session,get(k){return headers[k.toLowerCase()]}}}
test('richiede origine HTTPS valida',()=>assert.throws(()=>createSecurity('http://localhost:3003'),/HTTPS/));
test('blocca richieste da origini diverse',()=>{let called=false;const r=res();security.originGuard(req({origin:'https://evil.example'}),r,()=>called=true);assert.equal(r.statusCode,403);assert.equal(called,false)});
test('ammette origine esatta',()=>{let called=false;security.originGuard(req({origin}),res(),()=>called=true);assert.equal(called,true)});
test('blocca sessione anonima',()=>{let called=false;const r=res();security.richiediAccesso(req({origin}),r,()=>called=true);assert.equal(r.statusCode,401);assert.equal(called,false)});
test('genera token CSRF soltanto dopo login',()=>{const r=res();security.token(req({origin}),r);assert.equal(r.statusCode,401);const s={authenticated:true,save(cb){cb(null)}};const ok=res();security.token(req({origin},s),ok);assert.equal(ok.data.csrfToken.length,64);assert.equal(s.csrfToken,ok.data.csrfToken)});
test('richiede token e origine corretti',()=>{const s={authenticated:true,csrfToken:'a'.repeat(64)};for(const headers of [{origin},{origin,'x-csrf-token':'b'.repeat(64)},{origin:'https://evil.example','x-csrf-token':'a'.repeat(64)}]){const r=res();security.richiediCsrf(req(headers,s),r,()=>{throw Error('unexpected')});assert.equal(r.statusCode,403)}let called=false;security.richiediCsrf(req({origin,'x-csrf-token':'a'.repeat(64)},s),res(),()=>called=true);assert.equal(called,true)});
