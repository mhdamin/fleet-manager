import React, { useState, useEffect } from 'react';
import {
  CheckCircle, ArrowRight, ArrowLeft, Car, AlertOctagon, PenTool, X, Camera, Loader
} from 'lucide-react';
import { config, auth } from '../../config';

// --- TYPES ---
interface Vehicle {
  id: string;
  plateNumber: string;
  manufacturer: string;
  model: string;
  year: number;
  status: string;
}

interface InspectionPoint {
  id: number;
  x: number;
  y: number;
  label: string;
  status: 'Normal' | 'Abnormal' | 'N/A' | 'Not Inspected';
  notes?: string;
  defectType?: 'SCRATCH' | 'DENT' | 'CRACK';
}

interface InteriorSection {
  key: string;
  status: 'Normal' | 'Abnormal' | 'N/A' | 'Not Inspected';
  notes: string;
}

interface ChecklistData {
  vehicleId: string;
  checklistNumber: string;
  type: string;
  customerName: string;
  customerPhone: string;
  rentalStartDate: string;
  staffName: string;
  exteriorPoints: InspectionPoint[];
  interiorSections: InteriorSection[];
}

// --- INITIAL STATE ---
const INITIAL_POINTS: InspectionPoint[] = [
  { id: 1, x: 50, y: 35, label: '1', status: 'Normal' },
  { id: 3, x: 50, y: 50, label: '3', status: 'Normal' },
  { id: 32, x: 50, y: 65, label: '32', status: 'Normal' },
  { id: 17, x: 32, y: 45, label: '17', status: 'Normal' },
  { id: 18, x: 68, y: 45, label: '18', status: 'Normal' },
  { id: 51, x: 28, y: 55, label: '51', status: 'Normal' },
  { id: 28, x: 72, y: 55, label: '28', status: 'Normal' },
  { id: 5, x: 50, y: 15, label: '5', status: 'Normal' },
  { id: 44, x: 50, y: 85, label: '44', status: 'Normal' },
];

const INTERIOR_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard & Controls' },
  { key: 'seats', label: 'Seats & Upholstery' },
  { key: 'carpets', label: 'Floor Mats & Carpets' },
  { key: 'windows', label: 'Windows & Mirrors' },
  { key: 'electronics', label: 'Electronics & Audio' },
  { key: 'safety', label: 'Safety Equipment' },
];

const ChecklistManager: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ChecklistData>({
    vehicleId: '',
    checklistNumber: `CL-${Date.now()}`,
    type: '',
    customerName: '',
    customerPhone: '',
    rentalStartDate: new Date().toISOString().split('T')[0],
    staffName: auth.getUsername() || 'Staff Member',
    exteriorPoints: INITIAL_POINTS,
    interiorSections: INTERIOR_SECTIONS.map(s => ({ key: s.key, status: 'Normal', notes: '' }))
  });

  const [modalPoint, setModalPoint] = useState<InspectionPoint | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 1, name: 'Vehicle Info' },
    { id: 2, name: 'Checklist Type' },
    { id: 3, name: 'Exterior' },
    { id: 4, name: 'Interior' },
    { id: 5, name: 'Summary' },
  ];

  // Fetch vehicles on mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/vehicles`, {
        headers: {
          'Authorization': auth.getAuthHeader(),
        },
      });

      if (response.ok) {
        const vehicleData = await response.json();
        setVehicles(vehicleData.filter((v: Vehicle) => v.status === 'Available'));
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

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

  const updateInteriorSection = (key: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      interiorSections: prev.interiorSections.map(s =>
        s.key === key ? { ...s, [field]: value } : s
      )
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!data.vehicleId || !data.customerName || !data.customerPhone) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    if (step === 2 && !data.type) {
      setError('Please select a checklist type');
      return false;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(5, s + 1));
    }
  };

  const completeChecklist = async () => {
    setSubmitting(true);
    setError('');

    try {
      // 1. Create main checklist
      const checklistPayload = {
        checklistNumber: data.checklistNumber,
        rentalStartDate: data.rentalStartDate,
        rentalEndDate: null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        staffName: data.staffName,
        rentalType: data.type,
        vehicleId: data.vehicleId
      };

      const checklistResponse = await fetch(`${config.apiUrl}/api/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.getAuthHeader(),
        },
        body: JSON.stringify(checklistPayload),
      });

      if (!checklistResponse.ok) {
        throw new Error('Failed to create checklist');
      }

      const checklistId = await checklistResponse.text(); // UUID returned as text

      // 2. Create sub-checklists for each section
      // Exterior sub-checklist
      const exteriorSubChecklist = {
        type: 'EXTERIOR',
        staffName: data.staffName,
        remarks: `Exterior inspection completed. ${data.exteriorPoints.filter(p => p.status === 'Abnormal').length} issues found.`,
        checklistId: checklistId.replace(/"/g, '') // Remove quotes from UUID
      };

      const exteriorResponse = await fetch(`${config.apiUrl}/api/sub-checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.getAuthHeader(),
        },
        body: JSON.stringify(exteriorSubChecklist),
      });

      if (!exteriorResponse.ok) {
        throw new Error('Failed to create exterior sub-checklist');
      }

      // Interior sub-checklist
      const interiorSubChecklist = {
        type: 'INTERIOR',
        staffName: data.staffName,
        remarks: `Interior inspection completed. ${data.interiorSections.filter(s => s.status === 'Abnormal').length} issues found.`,
        checklistId: checklistId.replace(/"/g, '')
      };

      await fetch(`${config.apiUrl}/api/sub-checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.getAuthHeader(),
        },
        body: JSON.stringify(interiorSubChecklist),
      });

      // 3. Create defects for abnormal inspection points
      const abnormalPoints = data.exteriorPoints.filter(p => p.status === 'Abnormal');
      for (const point of abnormalPoints) {
        const defectPayload = {
          itemId: point.id,
          defectType: point.defectType || 'SCRATCH',
          description: point.notes || `Defect found at inspection point ${point.id}`,
          diagramX: Math.round(point.x),
          diagramY: Math.round(point.y)
        };

        await fetch(`${config.apiUrl}/api/checklists/${checklistId.replace(/"/g, '')}/defects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth.getAuthHeader(),
          },
          body: JSON.stringify(defectPayload),
        });
      }

      // Success!
      alert(`✅ Inspection Completed!\n\nChecklist Number: ${data.checklistNumber}\n\nThe inspection has been saved to the database.`);

      // Reset form
      setData({
        ...data,
        vehicleId: '',
        checklistNumber: `CL-${Date.now()}`,
        type: '',
        customerName: '',
        customerPhone: '',
        exteriorPoints: INITIAL_POINTS,
        interiorSections: INTERIOR_SECTIONS.map(s => ({ key: s.key, status: 'Normal', notes: '' }))
      });
      setStep(1);

    } catch (err: any) {
      console.error('Error completing checklist:', err);
      setError(err.message || 'Failed to save checklist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return <StepInfo data={data} onChange={updateField} vehicles={vehicles} loadingVehicles={loadingVehicles} />;
      case 2:
        return <StepType selected={data.type} onSelect={(t) => updateField('type', t)} />;
      case 3:
        return <StepExterior points={data.exteriorPoints} onPointClick={handlePointClick} />;
      case 4:
        return <StepInterior sections={data.interiorSections} onUpdate={updateInteriorSection} />;
      case 5:
        return <StepSummary data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                ${step === s.id ? 'bg-gray-900 text-white' : step > s.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertOctagon size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

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

        {step < 5 ? (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-md"
          >
            Next Step <ArrowRight size={18} className="ml-2" />
          </button>
        ) : (
          <button
            onClick={completeChecklist}
            disabled={submitting}
            className="flex items-center px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <><Loader size={18} className="mr-2 animate-spin" /> Saving...</>
            ) : (
              <>Complete Inspection <CheckCircle size={18} className="ml-2" /></>
            )}
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

const StepInfo = ({ data, onChange, vehicles, loadingVehicles }: any) => (
  <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
    <h3 className="text-xl font-bold text-gray-800 border-b pb-4">Vehicle Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-1">Select Vehicle *</label>
        {loadingVehicles ? (
          <div className="flex items-center text-gray-500"><Loader size={16} className="animate-spin mr-2" /> Loading vehicles...</div>
        ) : (
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={data.vehicleId}
            onChange={e => onChange('vehicleId', e.target.value)}
          >
            <option value="">-- Select a vehicle --</option>
            {vehicles.map((v: Vehicle) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber} - {v.manufacturer} {v.model} ({v.year})
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Checklist Number</label>
        <input type="text" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" value={data.checklistNumber} readOnly />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Rental Start Date *</label>
        <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.rentalStartDate} onChange={e => onChange('rentalStartDate', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name *</label>
        <input type="text" placeholder="Enter customer name" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.customerName} onChange={e => onChange('customerName', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Customer Phone *</label>
        <input type="tel" placeholder="Enter phone number" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={data.customerPhone} onChange={e => onChange('customerPhone', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-1">Staff Name</label>
        <input type="text" className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" value={data.staffName} readOnly />
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
        { id: 'maintenance', title: 'Maintenance Inspection', desc: 'Regular maintenance and service inspection', icon: PenTool },
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
  const normalCount = points.filter(p => p.status === 'Normal').length;
  const abnormalCount = points.filter(p => p.status === 'Abnormal').length;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Exterior Inspection</h3>
      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> Normal: {normalCount}</span>
        <span className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div> Abnormal: {abnormalCount}</span>
      </div>
      <div className="relative w-[300px] h-[500px] bg-gray-50 border border-gray-200 rounded-3xl shadow-inner p-4">
        <div className="w-full h-full relative">
          {/* Car Shape */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-10 border-2 border-gray-400 rounded-t-xl bg-white"></div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-32 border-2 border-gray-400 rounded-xl bg-white"></div>
          <div className="absolute top-44 left-1/2 -translate-x-1/2 w-44 h-40 border-2 border-gray-400 rounded-xl bg-white z-10"></div>
          <div className="absolute top-[340px] left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-gray-400 rounded-xl bg-white"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10 border-2 border-gray-400 rounded-b-xl bg-white"></div>
          <div className="absolute top-20 -left-2 w-10 h-64 border-2 border-gray-400 rounded-l-xl bg-white"></div>
          <div className="absolute top-20 -right-2 w-10 h-64 border-2 border-gray-400 rounded-r-xl bg-white"></div>
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
  const [defectType, setDefectType] = useState<'SCRATCH' | 'DENT' | 'CRACK'>(point.defectType || 'SCRATCH');

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

          {status === 'Abnormal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Defect Type</label>
              <select
                value={defectType}
                onChange={e => setDefectType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="SCRATCH">Scratch</option>
                <option value="DENT">Dent</option>
                <option value="CRACK">Crack</option>
              </select>
            </div>
          )}

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
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={() => onSave({ ...point, status: status as any, notes, defectType })} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">Save Inspection</button>
        </div>
      </div>
    </div>
  );
};

const StepInterior = ({ sections, onUpdate }: any) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-4">Interior Components</h3>
      {INTERIOR_SECTIONS.map((section) => {
        const sectionData = sections.find((s: any) => s.key === section.key);
        return (
          <div key={section.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <span className="font-semibold text-gray-800">{section.label}</span>
            </div>
            <div className="flex gap-4 mb-3 flex-wrap">
              {['Normal', 'Abnormal', 'N/A', 'Not Inspected'].map(opt => (
                <label key={opt} className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={section.key}
                    checked={sectionData?.status === opt}
                    onChange={() => onUpdate(section.key, 'status', opt)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">{opt}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add notes..."
              value={sectionData?.notes || ''}
              onChange={e => onUpdate(section.key, 'notes', e.target.value)}
              className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        );
      })}
    </div>
  );
};

const StepSummary = ({ data }: any) => {
  const selectedVehicle = data.vehicleId;
  const abnormalExterior = data.exteriorPoints.filter((p: InspectionPoint) => p.status === 'Abnormal').length;
  const abnormalInterior = data.interiorSections.filter((s: any) => s.status === 'Abnormal').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-xl font-bold text-gray-800">Inspection Summary</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${abnormalExterior + abnormalInterior === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {abnormalExterior + abnormalInterior === 0 ? 'Approved' : 'Issues Found'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Inspection Details</h4>
          <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Checklist #:</span> <span className="font-medium">{data.checklistNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type:</span> <span className="font-medium">{data.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer:</span> <span className="font-medium">{data.customerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium">{data.customerPhone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffName}</span></div>
          </div>

          <h4 className="font-semibold text-gray-700 mt-6 mb-2">Inspection Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span>Exterior</span>
              <span className={`text-sm font-bold flex items-center ${abnormalExterior === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {abnormalExterior === 0 ? <><CheckCircle size={14} className="mr-1"/> Passed</> : <><AlertOctagon size={14} className="mr-1"/> {abnormalExterior} Issues</>}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span>Interior</span>
              <span className={`text-sm font-bold flex items-center ${abnormalInterior === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {abnormalInterior === 0 ? <><CheckCircle size={14} className="mr-1"/> Passed</> : <><AlertOctagon size={14} className="mr-1"/> {abnormalInterior} Issues</>}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Issues Found</h4>
          <div className="bg-gray-50 border p-4 rounded-lg max-h-80 overflow-y-auto">
            {abnormalExterior + abnormalInterior === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No issues found - Vehicle is in good condition</p>
            ) : (
              <div className="space-y-2">
                {data.exteriorPoints.filter((p: InspectionPoint) => p.status === 'Abnormal').map((p: InspectionPoint) => (
                  <div key={p.id} className="text-sm border-l-4 border-red-500 pl-3 py-1">
                    <div className="font-medium">Exterior Point #{p.id}</div>
                    <div className="text-gray-600">{p.defectType || 'Defect'}: {p.notes || 'No details provided'}</div>
                  </div>
                ))}
                {data.interiorSections.filter((s: any) => s.status === 'Abnormal').map((s: any) => (
                  <div key={s.key} className="text-sm border-l-4 border-amber-500 pl-3 py-1">
                    <div className="font-medium">{INTERIOR_SECTIONS.find(sec => sec.key === s.key)?.label}</div>
                    <div className="text-gray-600">{s.notes || 'No details provided'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistManager;
