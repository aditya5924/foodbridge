import {Router} from 'express';
import multer from 'multer';
import {randomUUID} from 'node:crypto';
import {extname,resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
import {authenticate,asyncRoute,fail} from '../middleware/auth.js';
const r=Router();r.use(authenticate);
const dir=resolve(process.env.UPLOAD_DIR||'uploads');mkdirSync(dir,{recursive:true});
const allowed={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
const upload=multer({storage:multer.diskStorage({destination:dir,filename:(req,file,cb)=>cb(null,randomUUID()+allowed[file.mimetype])}),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>allowed[file.mimetype]?cb(null,true):cb(fail(422,'INVALID_FILE','JPEG, PNG or WebP required'))});
r.post('/',upload.single('file'),asyncRoute(async(req,res)=>{
 if(!req.file)throw fail(422,'VALIDATION_ERROR','file is required');
 // TODO production: inspect magic bytes, virus scan, private storage, signed URLs and retention.
 res.status(201).json({url:`${process.env.PUBLIC_BASE_URL||'http://localhost:5000'}/uploads/${req.file.filename}`,key:req.file.filename,contentType:req.file.mimetype,size:req.file.size});
}));
export default r;
