import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';
export const list=choose(()=>mock.organizations.list(),()=>http('/organizations'));
export const verify=choose(id=>mock.organizations.verify(id),id=>http(`/organizations/${encodeURIComponent(id)}/verify`,{method:'POST'}));
export const reject=choose((id,reason)=>mock.organizations.reject(id,reason),(id,reason)=>http(`/organizations/${encodeURIComponent(id)}/reject`,{method:'POST',body:{reason}}));
