import test from 'node:test';import assert from 'node:assert/strict';import {createHash,createHmac} from 'node:crypto';
import {gatewayIdentity} from './gateway-identity.js';
const secret='test-only',raw='{"body":"hello"}',ip='203.0.113.1',ts=String(Math.floor(Date.now()/1000));
const signed=()=>new Headers({'x-community-client':ip,'x-community-timestamp':ts,'x-community-signature':createHmac('sha256',secret).update(ts+'\n'+ip+'\n'+createHash('sha256').update(raw).digest('hex')).digest('hex')});
test('trusted gateway identity must bind IP, timestamp and exact body',async()=>{assert.equal(await gatewayIdentity(signed(),raw,secret),ip);assert.equal(await gatewayIdentity(signed(),raw+'x',secret),null);assert.equal(await gatewayIdentity(signed(),raw,'wrong'),null)});
test('missing and expired signatures fail closed',async()=>{assert.equal(await gatewayIdentity(new Headers(),raw,secret),null);assert.equal(await gatewayIdentity(signed(),raw,secret,Date.now()+120000),null)});
