import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';
export const list=choose(userId=>mock.schedules.list(userId),()=>http('/donor/schedules'));
export const create=choose((body,userId)=>mock.schedules.create(body,userId),body=>http('/donor/schedules',{method:'POST',body}));
