import { choose } from '../mode';
import { mock } from '../mockAdapter';
import { http, setAccessToken } from '../http';

export const login = choose((credentials)=>mock.auth.login(credentials),async (credentials)=>{const result=await http('/auth/login',{method:'POST',body:credentials});return {...result,token:result.accessToken||result.token};});
export const register = choose((data)=>mock.auth.register(data),async (data)=>{const result=await http('/auth/register',{method:'POST',body:data});return {...result,token:result.accessToken||result.token};});
export const me = choose((userId)=>mock.auth.me(userId),()=>http('/auth/me'));
export const logout = () => { setAccessToken(null); return Promise.resolve(); };
