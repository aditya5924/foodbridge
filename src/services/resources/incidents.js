import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';
export const list=choose(()=>mock.incidents.list(),()=>http('/incidents'));
export const create=choose((body,userId)=>mock.incidents.create(body,userId),body=>http('/incidents',{method:'POST',body}));
export const resolve=choose((id,resolution)=>mock.incidents.resolve(id,resolution),(id,resolution)=>http(`/incidents/${encodeURIComponent(id)}/resolve`,{method:'POST',body:{resolution}}));
