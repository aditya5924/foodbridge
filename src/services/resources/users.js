import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';
export const volunteers=choose(()=>mock.users.list(),()=>http('/users?role=volunteer'));
export const profile=choose(id=>mock.users.profile(id),()=>http('/auth/me'));
export const update=choose((id,body)=>mock.users.update(id,body),(_,body)=>http('/auth/me',{method:'PATCH',body}));
