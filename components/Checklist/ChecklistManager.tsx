import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle, ArrowRight, ArrowLeft, Upload, FileText, 
  Car, Shield, AlertOctagon, PenTool, X, Camera 
} from 'lucide-react';
import { ChecklistData, InspectionPoint } from '../../types';

// --- INITIAL STATE ---
const INITIAL_POINTS: InspectionPoint[] = [
  { id: 1, x: 50, y: 35, label: '1', status: 'Normal' }, // Hood
  { id: 3, x: 50, y: 50, label: '3', status: 'Normal' }, // Roof
  { id: 32, x: 50, y: 65, label: '32', status: 'Normal' }, // Trunk
  { id: 17, x: 32, y: 45, label: '17', status: 'Normal' }, // Left Door Front
  { id: 18, x: 68, y: 45, label: '18', status: 'Normal' }, // Right Door Front
  { id: 51, x: 28, y: 55, label: '51', status: 'Abnormal' }, // Left Rear Fender
  { id: 28, x: 72, y: 55, label: '28', status: 'Abnormal' }, // Right Rear Fender
  { id: 5, x: 50, y: 15, label: '5', status: 'Normal' }, // Front Bumper
  { id: 44, x: 50, y: 85, label: '44', status: 'Normal' }, // Rear Bumper
];

const INITIAL_DATA: ChecklistData = {
  vehicleId: '', plate: '', makeModel: '', odometer: '', fuelLevel: 'Full',
  type: '',
  exteriorPoints: INITIAL_POINTS,
  interior: {
    dashboard: '', seats: '', carpets: '', windows: '', electronics: '', safety: ''
  },
  signature: {
    customerName: '', inspectorName: 'John Smith', date: new Date().toISOString().split('T')[0], signed: false
  }
};

const ChecklistManager: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ChecklistData>(INITIAL_DATA);
  const [modalPoint, setModalPoint] = useState<InspectionPoint | null>(null);

  const steps = [
    { id: 1, name: 'Vehicle Info' },
    { id: 2, name: 'Checklist Type' },
    { id: 3, name: 'Exterior' },
    { id: 4, name: 'Interior' },
    { id: 5, name: 'Tyres' },
    { id: 6, name: 'Signature' },
    { id: 7, name: 'Summary' },
  ];

  const updateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePointClick = (point: InspectionPoint) => {
    setModalPoint(point);
  };

  const savePointData = (updatedPoint: InspectionPoint) => {
    setData(prev => ({
      ...prev,
      exteriorPoints: prev.exteriorPoints.map(p => p.id === updatedPoint.id ? updatedPoint : p)
    }));
    setModalPoint(null);
  };

  const renderStepContent = () => {
    switch(step) {
      case 1: return <StepInfo data={data} onChange={updateField} />;
      case 2: return <StepType selected={data.type} onSelect={(t) => updateField('type', t)} />;
      case 3: return <StepExterior points={data.exteriorPoints} onPointClick={handlePointClick} />;
      case 4: return <StepInterior data={data} onChange={updateField} />;
      case 5: return <StepTyres />;
      case 6: return <StepSignature data={data} onChange={updateField} />;
      case 7: return <StepSummary data={data} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs / Progress */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                  ${step === s.id ? 'bg-gray-900 text-white' : step > s.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                `}
              >
                {step > s.id ? <CheckCircle size={16} /> : s.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${step === s.id ? 'text-gray-900' : 'text-gray-500'}`}>{s.name}</span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-3 ${step > s.id ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className={`flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft size={18} className="mr-2" /> Previous Step
        </button>
        
        {step < 7 ? (
          <button 
            onClick={() => setStep(s => Math.min(7, s + 1))}
            className="flex items-center px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-md"
          >
            Next Step <ArrowRight size={18} className="ml-2" />
          </button>
        ) : (
          <button 
            onClick={() => alert('Inspection Completed!')}
            className="flex items-center px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md"
          >
            Complete Check-out <CheckCircle size={18} className="ml-2" />
          </button>
        )}
      </div>

      {/* Exterior Point Modal */}
      {modalPoint && (
        <PointModal 
          point={modalPoint} 
          onClose={() => setModalPoint(null)} 
          onSave={savePointData} 
        />
      )}
    </div>
  );
};

// --- SUB COMPONENTS ---

const StepInfo = ({ data, onChange }: { data: ChecklistData, onChange: (f:string, v:any)=>void }) => (
  <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
    <h3 className="text-xl font-bold text-gray-800 border-b pb-4">Vehicle Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle ID</label>
         <input type="text" placeholder="Enter vehicle ID" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.vehicleId} onChange={e => onChange('vehicleId', e.target.value)} />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">License Plate</label>
         <input type="text" placeholder="Enter license plate" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.plate} onChange={e => onChange('plate', e.target.value)} />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">Make & Model</label>
         <input type="text" placeholder="e.g. Toyota Camry" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.makeModel} onChange={e => onChange('makeModel', e.target.value)} />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">Current Odometer (km)</label>
         <input type="text" placeholder="e.g. 45000" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.odometer} onChange={e => onChange('odometer', e.target.value)} />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">Check-out Date</label>
         <input type="datetime-local" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" defaultValue="2025-06-17T09:00" />
       </div>
       <div>
         <label className="block text-sm font-medium text-gray-600 mb-1">Fuel Level</label>
         <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.fuelLevel} onChange={e => onChange('fuelLevel', e.target.value)}>
           <option>Full</option>
           <option>3/4</option>
           <option>1/2</option>
           <option>1/4</option>
           <option>Empty</option>
         </select>
       </div>
       <div className="md:col-span-2">
         <label className="block text-sm font-medium text-gray-600 mb-1">Customer Details</label>
         <textarea className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Enter name, contact info..." rows={3}></textarea>
       </div>
       <div className="md:col-span-2 flex items-center">
         <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
         <span className="ml-2 text-sm text-gray-600">I confirm all vehicle details are correct</span>
       </div>
    </div>
  </div>
);

const StepType = ({ selected, onSelect }: { selected: string, onSelect: (t:string)=>void }) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <h3 className="text-xl font-bold text-gray-800 text-center">Select checklist type</h3>
    <div className="space-y-4">
      {[
        { id: 'pickup', title: 'Vehicle Pickup Checklist', desc: 'Inspection performed when customer picks up the vehicle', icon: Car },
        { id: 'return', title: 'Vehicle Return Checklist', desc: 'Inspection performed when customer returns the vehicle', icon: Car },
        { id: 'maint', title: 'Maintenance Inspection', desc: 'Regular maintenance and service inspection', icon: PenTool },
        { id: 'damage', title: 'Damage Assessment', desc: 'Detailed inspection for damage reporting', icon: AlertOctagon },
      ].map((item) => (
        <div 
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`p-4 border-2 rounded-xl cursor-pointer flex items-center transition-all ${selected === item.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
        >
          <div className={`p-3 rounded-full mr-4 ${selected === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            <item.icon size={24} />
          </div>
          <div>
            <h4 className={`font-semibold ${selected === item.id ? 'text-blue-900' : 'text-gray-800'}`}>{item.title}</h4>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
          <div className="ml-auto">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === item.id ? 'border-blue-600' : 'border-gray-300'}`}>
              {selected === item.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StepExterior = ({ points, onPointClick }: { points: InspectionPoint[], onPointClick: (p: InspectionPoint) => void }) => {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Exterior Inspection</h3>
      <div className="relative w-[300px] h-[500px] bg-gray-50 border border-gray-200 rounded-3xl shadow-inner p-4">
         {/* Abstract Car Shape using CSS Grid/Flex for Mockup */}
         <div className="w-full h-full relative">
            {/* Front Bumper */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-10 border-2 border-gray-400 rounded-t-xl bg-white"></div>
            {/* Hood */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-32 border-2 border-gray-400 rounded-xl bg-white"></div>
            {/* Roof */}
            <div className="absolute top-44 left-1/2 -translate-x-1/2 w-44 h-40 border-2 border-gray-400 rounded-xl bg-white z-10"></div>
             {/* Trunk */}
            <div className="absolute top-[340px] left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-gray-400 rounded-xl bg-white"></div>
            {/* Rear Bumper */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10 border-2 border-gray-400 rounded-b-xl bg-white"></div>
            
            {/* Left Sides */}
            <div className="absolute top-20 -left-2 w-10 h-64 border-2 border-gray-400 rounded-l-xl bg-white"></div>
             {/* Right Sides */}
            <div className="absolute top-20 -right-2 w-10 h-64 border-2 border-gray-400 rounded-r-xl bg-white"></div>

            {/* Wheels */}
            <div className="absolute top-24 -left-6 w-6 h-12 bg-gray-700 rounded-l"></div>
            <div className="absolute top-24 -right-6 w-6 h-12 bg-gray-700 rounded-r"></div>
            <div className="absolute top-[300px] -left-6 w-6 h-12 bg-gray-700 rounded-l"></div>
            <div className="absolute top-[300px] -right-6 w-6 h-12 bg-gray-700 rounded-r"></div>

            {/* Hotspots */}
            {points.map(p => (
              <button
                key={p.id}
                onClick={() => onPointClick(p)}
                style={{ top: `${p.y}%`, left: `${p.x}%` }}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform z-20
                  ${p.status === 'Abnormal' ? 'bg-red-500 text-white animate-pulse' : 
                    p.status === 'Normal' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}
                `}
              >
                {p.id}
              </button>
            ))}
         </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">Click on the numbered zones to record status or damage.</p>
    </div>
  );
};

const PointModal = ({ point, onClose, onSave }: { point: InspectionPoint, onClose: ()=>void, onSave:(p:InspectionPoint)=>void }) => {
  const [status, setStatus] = useState(point.status || 'Normal');
  const [notes, setNotes] = useState(point.notes || '');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center p-4 border-b">
           <h3 className="text-lg font-bold">Inspection Point #{point.id}</h3>
           <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-700"/></button>
        </div>
        <div className="p-6 space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Condition Status</label>
             <div className="grid grid-cols-2 gap-3">
               {['Normal', 'Abnormal', 'N/A', 'Not Inspected'].map(s => (
                 <button 
                   key={s}
                   onClick={() => setStatus(s as any)}
                   className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                     ${status === s 
                        ? (s === 'Abnormal' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700') 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                   `}
                 >
                   <div className="flex items-center">
                     <div className={`w-3 h-3 rounded-full mr-2 ${status === s ? 'bg-current' : 'border border-gray-400'}`}></div>
                     {s}
                   </div>
                 </button>
               ))}
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
               rows={3}
               placeholder="Add detailed inspection notes..."
             />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                  <Camera size={24} className="mb-2" />
                  <span className="text-xs">Drag photos here or click to browse</span>
              </div>
           </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
           <button onClick={() => onSave({ ...point, status: status as any, notes })} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">Save Inspection</button>
        </div>
      </div>
    </div>
  );
};

const StepInterior = ({ data, onChange }: any) => {
  const sections = [
    { key: 'dashboard', label: 'Dashboard & Controls' },
    { key: 'seats', label: 'Seats & Upholstery' },
    { key: 'carpets', label: 'Floor Mats & Carpets' },
    { key: 'windows', label: 'Windows & Mirrors' },
    { key: 'electronics', label: 'Electronics & Audio' },
    { key: 'safety', label: 'Safety Equipment' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <h3 className="text-xl font-bold text-gray-800 border-b pb-4">Interior Components</h3>
       {sections.map((section) => (
         <div key={section.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
               <span className="font-semibold text-gray-800">{section.label}</span>
               <button className="text-gray-400 hover:text-blue-600"><Camera size={18}/></button>
            </div>
            <div className="flex gap-4 mb-3">
               {['Normal', 'Abnormal', 'N/A', 'Not Inspected'].map(opt => (
                 <label key={opt} className="flex items-center text-sm cursor-pointer">
                    <input type="radio" name={section.key} className="mr-2 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-600">{opt}</span>
                 </label>
               ))}
            </div>
            <input type="text" placeholder="Add notes..." className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
         </div>
       ))}
    </div>
  );
};

const StepTyres = () => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
    <CheckCircle size={48} className="text-green-500 mb-4" />
    <h3 className="text-lg font-bold text-gray-800">Tyre Inspection</h3>
    <p>All tyres recorded as "Good Condition" automatically for this demo.</p>
  </div>
);

const StepSignature = ({ data, onChange }: any) => {
  const [signed, setSigned] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Signature Pads */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Digital Signature</h3>
        
        <div>
           <label className="block text-sm font-medium text-gray-600 mb-2">Customer Signature</label>
           <div 
             className="h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center cursor-pointer relative"
             onClick={() => setSigned(true)}
           >
             {!signed ? (
               <div className="text-center text-gray-400">
                 <PenTool className="mx-auto mb-2 opacity-50" />
                 <span className="text-sm">Click to Simulate Signing</span>
               </div>
             ) : (
               <div className="font-script text-4xl text-blue-900 rotate-[-5deg]">John Doe</div>
             )}
           </div>
           <div className="flex justify-between mt-2">
             <button className="text-xs text-red-500 hover:underline" onClick={() => setSigned(false)}>Clear</button>
           </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-600 mb-2">Inspector Signature</label>
           <div className="h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
             <div className="font-script text-3xl text-gray-600 opacity-70">John Smith</div>
           </div>
        </div>
      </div>

      {/* Details Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Signature Details</h3>
        <input className="w-full p-2 border rounded-lg bg-gray-50" placeholder="Customer Full Name" />
        <input className="w-full p-2 border rounded-lg bg-gray-50" placeholder="Customer ID / License" />
        <input className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500" value="Inspector: John Smith" readOnly />
        <input className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500" value={`Date: ${new Date().toLocaleString()}`} readOnly />
        
        <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 leading-relaxed border border-blue-100 mt-4">
          <strong>Terms & Conditions</strong><br/>
          By signing, the customer acknowledges the vehicle condition as inspected above. 
          Any existing damage has been noted. The customer agrees to return the vehicle in the same condition.
        </div>
        
        <label className="flex items-center mt-2">
           <input type="checkbox" className="mr-2" defaultChecked />
           <span className="text-sm text-gray-700">Customer acknowledges terms</span>
        </label>
      </div>
    </div>
  );
};

const StepSummary = ({ data }: any) => (
  <div className="max-w-4xl mx-auto space-y-6">
    <div className="flex justify-between items-center border-b pb-4">
      <h3 className="text-xl font-bold text-gray-800">Inspection Summary</h3>
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Approved for Rental</span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
         <h4 className="font-semibold text-gray-700 mb-2">Vehicle Information</h4>
         <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
           <div className="flex justify-between"><span className="text-gray-500">ID:</span> <span className="font-medium">RNT-001</span></div>
           <div className="flex justify-between"><span className="text-gray-500">Model:</span> <span className="font-medium">Toyota Camry</span></div>
           <div className="flex justify-between"><span className="text-gray-500">Fuel:</span> <span className="font-medium">Full</span></div>
         </div>

         <h4 className="font-semibold text-gray-700 mt-6 mb-2">Inspection Results</h4>
         <div className="space-y-2">
           <div className="flex justify-between items-center p-3 border rounded-lg">
             <span>Exterior</span>
             <span className="text-green-600 text-sm font-bold flex items-center"><CheckCircle size={14} className="mr-1"/> Passed</span>
           </div>
           <div className="flex justify-between items-center p-3 border rounded-lg">
             <span>Interior</span>
             <span className="text-amber-600 text-sm font-bold flex items-center"><AlertOctagon size={14} className="mr-1"/> Minor Issues</span>
           </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
             <span>Tyres</span>
             <span className="text-green-600 text-sm font-bold flex items-center"><CheckCircle size={14} className="mr-1"/> Passed</span>
           </div>
         </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Signatures</h4>
        <div className="bg-white border p-4 rounded-lg flex flex-col items-center justify-center h-32 mb-4">
           <span className="font-script text-3xl text-blue-900">John Doe</span>
           <span className="text-xs text-gray-400 mt-2">Customer Signature</span>
        </div>
        
        <h4 className="font-semibold text-gray-700 mb-2">Photos Attached</h4>
        <div className="grid grid-cols-2 gap-2">
           <div className="h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Exterior Front</div>
           <div className="h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Dashboard</div>
        </div>
      </div>
    </div>
  </div>
);

export default ChecklistManager;