import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';
export const list=choose(userId=>mock.notifications.list(userId),()=>http('/notifications'));
export const markRead=choose((id,userId)=>mock.notifications.read(id,userId),id=>http(`/notifications/${encodeURIComponent(id)}/read`,{method:'PATCH'}));
