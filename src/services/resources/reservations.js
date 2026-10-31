import { choose } from '../mode';
import { mock } from '../mockAdapter';
import { http } from '../http';
import { qs } from './query';

export const list = choose((filters)=>mock.reservations.list(filters),(filters={})=>http(`/reservations${qs(filters)}`));
export const create = choose((body,userId)=>mock.reservations.create(body,userId),(body)=>http('/reservations',{method:'POST',body}));
export const accept = choose((id)=>mock.reservations.update(id,'accepted'),(id)=>http(`/reservations/${encodeURIComponent(id)}/accept`,{method:'POST'}));
export const decline = choose((id,reason)=>mock.reservations.update(id,'declined',reason),(id,reason)=>http(`/reservations/${encodeURIComponent(id)}/decline`,{method:'POST',body:{reason}}));
