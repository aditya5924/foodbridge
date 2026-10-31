export const dateTime=value=>value?new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
export const timeLeft=value=>{if(!value)return 'No deadline';const ms=new Date(value).getTime()-Date.now();if(ms<=0)return 'Expired';const mins=Math.ceil(ms/60000);return mins>=60?`Closes in ${Math.floor(mins/60)}h ${mins%60}m`:`Closes in ${mins}m`;};
export const localInput=value=>{const d=value?new Date(value):new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
