import { choose } from '../mode';
import { mock } from '../mockAdapter';
import { http } from '../http';

export const upload = choose((file)=>mock.uploads.create(file),(file)=>{const form=new FormData();form.append('file',file);return http('/uploads',{method:'POST',body:form});});
