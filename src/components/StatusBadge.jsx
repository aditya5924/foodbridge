import React from 'react';
export default function StatusBadge({status}){const s=String(status||'unknown').toLowerCase();return <span className={`status status-${s.replace(/\s/g,'-')}`}><span className="status-dot"/>{s.replace(/\b\w/g,c=>c.toUpperCase())}</span>}
