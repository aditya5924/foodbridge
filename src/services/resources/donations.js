import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';import {qs} from './query';
export const list=choose(f=>mock.donations.list(f),f=>http(`/donations${qs(f||{})}`));
export const get=choose(id=>mock.donations.get(id),id=>http(`/donations/${encodeURIComponent(id)}`));
export const create=choose((body,userId)=>mock.donations.create(body,userId),body=>http('/donations',{method:'POST',body}));
export const cancel=choose(id=>mock.donations.cancel(id),id=>http(`/donations/${encodeURIComponent(id)}/cancel`,{method:'POST'}));
export const timeline=choose(id=>mock.donations.timeline(id),id=>http(`/donations/${encodeURIComponent(id)}/events`));
export const matches=choose(id=>mock.donations.matches(id),id=>http(`/donations/${encodeURIComponent(id)}/matches`));
