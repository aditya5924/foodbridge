import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';import {qs} from './query';
export const list=choose(f=>mock.pickups.list(f),f=>http(`/pickups${qs(f||{})}`));
export const get=choose(id=>mock.pickups.get(id),id=>http(`/pickups/${encodeURIComponent(id)}`));
export const accept=choose((id,userId)=>mock.pickups.accept(id,userId),id=>http(`/pickups/${encodeURIComponent(id)}/accept`,{method:'POST'}));
export const assign=choose((id,userId)=>mock.pickups.assign(id,userId),(id,volunteerId)=>http(`/pickups/${encodeURIComponent(id)}/assign`,{method:'POST',body:{volunteerId}}));
export const handover=choose((id,body)=>mock.pickups.handover(id,body),(id,body)=>http(`/pickups/${encodeURIComponent(id)}/handover`,{method:'POST',body}));
export const organizationHandover=choose((id,organizationId)=>mock.pickups.organizationHandover(id,organizationId),id=>http(`/pickups/${encodeURIComponent(id)}/handover-code`));
