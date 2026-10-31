import React from 'react';
import {ArrowUpRight} from 'lucide-react';
export default function StatCard({icon:Icon,label,value,detail,tone='green'}){return <div className="stat-card"><div className="between"><span className={`stat-icon tone-${tone}`}><Icon size={21}/></span><ArrowUpRight size={17} className="muted"/></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{detail&&<p className="stat-detail">{detail}</p>}</div>}
