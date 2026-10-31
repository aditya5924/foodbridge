import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
const key=()=>createHash('sha256').update(process.env.HANDOVER_SECRET||process.env.JWT_SECRET).digest();
export function encryptCode(code){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([cipher.update(code,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');}
export function decryptCode(encoded){const data=Buffer.from(encoded,'base64url');const decipher=createDecipheriv('aes-256-gcm',key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');}
