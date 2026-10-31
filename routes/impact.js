import {Router} from 'express';
import {query} from '../config/db.js';
import {authenticate,asyncRoute,fail} from '../middleware/auth.js';
const r=Router();r.use(authenticate);
r.get('/monthly',asyncRoute(async(req,res)=>{
 const month=String(req.query.month||new Date().toISOString().slice(0,7));if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw fail(422,'VALIDATION_ERROR','month must be YYYY-MM');
 const start=`${month}-01T00:00:00Z`;
 const {rows:totals}=await query(`SELECT COALESCE(SUM(d.quantity) FILTER(WHERE p.status='delivered'),0)::float AS quantity,
 COUNT(*) FILTER(WHERE p.status='delivered')::int AS completed,
 COUNT(*) FILTER(WHERE p.status='missed')::int AS missed,
 COUNT(*) FILTER(WHERE p.status='cancelled')::int AS cancelled
 FROM pickups p JOIN donations d ON d.id=p.donation_id WHERE p.updated_at>= $1::timestamptz AND p.updated_at<($1::timestamptz+INTERVAL '1 month')`,[start]);
 const {rows:trend}=await query(`SELECT to_char(date_trunc('day',p.updated_at),'DD Mon') AS label,
 COALESCE(SUM(d.quantity) FILTER(WHERE p.status='delivered'),0)::float AS quantity
 FROM pickups p JOIN donations d ON d.id=p.donation_id WHERE p.updated_at>= $1::timestamptz AND p.updated_at<($1::timestamptz+INTERVAL '1 month') GROUP BY date_trunc('day',p.updated_at) ORDER BY date_trunc('day',p.updated_at)`,[start]);
 const t=totals[0];const conversionFactorKgPerUnit=1;
 res.json({month,rescuedQuantity:{value:t.quantity,unit:'mixed'},completedPickups:t.completed,missedCollections:t.missed,cancelledPickups:t.cancelled,estimatedWasteKg:null,conversionFactorKgPerUnit:null,trend,note:'Weight conversion not available for mixed donation units. Configure category-specific unit conversions before showing kg.'});
}));
export default r;
