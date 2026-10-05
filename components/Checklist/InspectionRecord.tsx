import React from 'react';
import {ChecklistResponse} from '../../services/api';
import {Button,Card} from '../AppUI';
import {downloadRecord,exteriorLabels,interiorLabels,tyreLabels} from './evidence';
export default function InspectionRecord({record}:{record:ChecklistResponse}){
 const e=record.evidence;
 return <Card className="workflow-card"><h2>{record.vehicle?.plateNumber} — {record.rentalType} inspection</h2><p>{record.customerName} · Inspector {record.staffName} · {record.completedAt?new Date(record.completedAt).toLocaleString():'Draft'}</p><div className="workflow-actions"><Button onClick={()=>window.print()}>Print / save PDF</Button><Button variant="secondary" onClick={()=>downloadRecord(record,record.checklistNumber)}>Download record</Button></div>{e?<><p>Odometer {e.odometer} km · Fuel {e.fuelLevel}</p>{e.exterior.map(p=><p key={p.id}><strong>{exteriorLabels[p.id-101]}</strong>: {p.status} {p.notes&&'— '+p.notes}</p>)}{Object.entries(e.interior).map(([k,v])=><p key={k}><strong>{interiorLabels[k]}</strong>: {v}</p>)}{Object.entries(e.tyres).map(([k,v])=><p key={k}><strong>{tyreLabels[k]} tyre</strong>: {v}</p>)}<div className="workflow-photos">{e.photos.map((p,i)=><figure key={i}><img src={p.data} alt={p.label}/><figcaption>{p.label}</figcaption></figure>)}</div><p>Customer acknowledgement: {e.acknowledged?e.acknowledgedBy:'Not recorded'}</p></>:<p>No condition evidence is available for this older record.</p>}</Card>;
}
