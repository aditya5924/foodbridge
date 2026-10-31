import React from 'react';
import {X} from 'lucide-react';
export default function Modal({title,children,onClose,wide=false}){return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><div className="between modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>{children}</div></div>}
