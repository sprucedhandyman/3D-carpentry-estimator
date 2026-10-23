import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics, safePage, CONSENT_KEY } from '../src/lib/analytics.mjs';
function setup({host = 'www.3dcabinetry.com', path = '/', id = 'G-TEST123', choice} = {}) {
 const values = new Map(choice ? [[CONSENT_KEY, choice]] : []), scripts = [];
 const win = {location: {hostname: host, pathname:path, search:'?email=private@example.com', hash:'#private', reload(){}}, localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}};
 const doc = {createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 const api = createAnalytics({win,doc,measurementId:id});
 return {api,win,scripts,commands:()=>Array.from(win.dataLayer || [], x=>Array.from(x))};
}
test('default, decline and missing measurement ID load no Google tag',()=>{
 for (const options of [{}, {choice:'denied'}, {choice:'granted',id:''}]) {const {api,scripts,commands}=setup(options);api.start();assert.equal(scripts.length,0);assert.deepEqual(commands(),[]);}
});
test('only explicit consent enables a single sanitized page view, including repeated StrictMode start',()=>{
 const {api,scripts,commands}=setup();api.choose('granted');api.start();api.pageView();assert.equal(scripts.length,1);
 const events=commands().filter(c=>c[0]==='event');assert.equal(events.length,1);assert.equal(events[0][2].page_location,'https://www.3dcabinetry.com/');
 assert.equal(JSON.stringify(commands()).includes('private'),false);
 const config=commands().find(c=>c[0]==='config')[2];assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);
});
test('portal and preview hosts never load Google even with stored consent',()=>{
 for(const opts of [{path:'/projects/wolcott-attic'},{path:'/blog/private-customer-name'},{host:'preview.vercel.app'},{host:'localhost'}]) {const {api,scripts}=setup({...opts,choice:'granted'});api.start();assert.equal(scripts.length,0);}
});
test('events accept fixed type values only and drop arbitrary form fields',()=>{
 const {api,commands}=setup({choice:'granted'});api.start();api.event('generate_lead','website_contact',{email:'private@example.com'});api.event('telephone_click','telephone_link');api.event('unknown','website_contact');api.event('generate_lead','customer notes');
 const events=commands().filter(c=>c[0]==='event');assert.equal(events.length,3);assert.equal(JSON.stringify(events).includes('private'),false);assert.equal(events[2][1],'telephone_click');
 api.choose('denied');api.event('generate_lead','website_contact');assert.equal(commands().filter(c=>c[0]==='event').length,3);
});
test('estimator completion supports only the public estimator and no estimate inputs',()=>{
 const {api,commands}=setup({host:'estimate.3dcabinetry.com',choice:'granted'});api.start();api.event('estimator_complete','residential_estimator');assert.equal(commands().filter(c=>c[1]==='estimator_complete').length,1);
});
test('safe page omits all URL query and fragment data',()=>{assert.equal(safePage({hostname:'www.3dcabinetry.com',pathname:'/services/built-ins',search:'?phone=123',hash:'#name'}),'https://www.3dcabinetry.com/services/built-ins');});
