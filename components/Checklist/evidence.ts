export interface InspectionEvidence {
  odometer:number; fuelLevel:string;
  exterior:{id:number;status:string;notes:string}[];
  interior:Record<string,string>; tyres:Record<string,string>;
  photos:{label:string;data:string}[];
  acknowledgedBy:string; acknowledged:boolean;
}
export const exteriorLabels=['Left front fender','Left front door','Left front quarter','Left sill','Left rear quarter','Front grille','Front bumper','Roof','Windscreen','Dashboard surface','Trunk floor','Rear bumper upper','Rear bumper lower','Right front fender','Right front door','Right door edge','Right rear door','Right rear quarter','Right sill','Right rear lower panel'];
export const interiorLabels:Record<string,string>={dashboard:'Dashboard and controls',seats:'Seats and upholstery',carpets:'Carpets and mats',windows:'Windows and mirrors',electronics:'Electronics',safety:'Safety equipment'};
export const tyreLabels:Record<string,string>={frontLeft:'Front left',frontRight:'Front right',rearLeft:'Rear left',rearRight:'Rear right'};
export const newEvidence=():InspectionEvidence=>({odometer:0,fuelLevel:'Full',exterior:exteriorLabels.map((_,i)=>({id:101+i,status:'Not Inspected',notes:''})),interior:Object.fromEntries(Object.keys(interiorLabels).map(k=>[k,''])),tyres:Object.fromEntries(Object.keys(tyreLabels).map(k=>[k,'Not Inspected'])),photos:[],acknowledgedBy:'',acknowledged:false});
export function downloadRecord(record:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function preparePhoto(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose a JPEG, PNG or WebP photo under 10 MB.');
 const bitmap=await createImageBitmap(file);
 try{const canvas=document.createElement('canvas');const scale=Math.min(1,960/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',0.7);if(data.length>250000)data=canvas.toDataURL('image/jpeg',0.35);if(data.length>250000)throw new Error('Choose a smaller image.');return{label:file.name.slice(0,100),data};}finally{bitmap.close();}
}
