import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';import {qs} from './query';
const normalizeDonation = d => d ? ({...d, donor: typeof d.donor === 'object' ? (d.donor?.name || 'Unknown donor') : d.donor}) : d;
export const list=choose(f=>mock.donations.list(f),async f=>(await http(`/donations${qs(f||{})}`)).map(normalizeDonation));
export const get=choose(id=>mock.donations.get(id),async id=>normalizeDonation(await http(`/donations/${encodeURIComponent(id)}`)));
export const create=choose((body,userId)=>mock.donations.create(body,userId),async body=>normalizeDonation(await http('/donations',{method:'POST',body})));
export const cancel=choose(id=>mock.donations.cancel(id),id=>http(`/donations/${encodeURIComponent(id)}/cancel`,{method:'POST'}));
export const timeline=choose(id=>mock.donations.timeline(id),async id=>(await http(`/donations/${encodeURIComponent(id)}/events`)).map(e=>({...e,actor: typeof e.actor === 'object' ? (e.actor?.name || 'System') : e.actor})));
export const matches=choose(id=>mock.donations.matches(id),id=>http(`/donations/${encodeURIComponent(id)}/matches`));
