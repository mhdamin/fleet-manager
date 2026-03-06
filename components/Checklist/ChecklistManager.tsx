import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  History,
  PenTool,
  Shield,
} from 'lucide-react';
import { Button, Card, FormField, ModalShell, SectionHeader, SelectInput, StatusBadge, TextArea, TextInput, cx } from '../AppUI';
import { apiPost, getChecklists, type ChecklistResponse } from '../../services/api';
import { ChecklistData, InspectionPoint } from '../../types';

type InspectionStatus = NonNullable<InspectionPoint['status']>;

type ExteriorInspectionPointMeta = {
  id: number;
  displayNumber: string;
  name: string;
  positionLabel: string;
  x: number;
  y: number;
  status: InspectionStatus;
};

const EXTERIOR_POINT_METAS: ExteriorInspectionPointMeta[] = [
  { id: 101, displayNumber: '64', name: 'Left Front Fender - Upper Arch', positionLabel: 'Vehicle Left Side / Front Fender Upper', x: 18, y: 27, status: 'Abnormal' },
  { id: 102, displayNumber: '17', name: 'Left Front Door - Upper Panel', positionLabel: 'Vehicle Left Side / Front Door Upper', x: 26, y: 44, status: 'Normal' },
  { id: 103, displayNumber: '51', name: 'Left Front Quarter Panel', positionLabel: 'Vehicle Left Side / Front Quarter Outer', x: 7, y: 53, status: 'Abnormal' },
  { id: 104, displayNumber: '17', name: 'Left Center Sill Panel', positionLabel: 'Vehicle Left Side / Center Sill', x: 34, y: 42, status: 'Normal' },
  { id: 105, displayNumber: '43', name: 'Left Rear Quarter - Lower Panel', positionLabel: 'Vehicle Left Side / Rear Quarter Lower', x: 21, y: 76, status: 'Abnormal' },
  { id: 106, displayNumber: '5', name: 'Front Grille Panel', positionLabel: 'Vehicle Front / Grille Center', x: 51, y: 7.8, status: 'Normal' },
  { id: 107, displayNumber: '9', name: 'Front Bumper - Upper Center', positionLabel: 'Vehicle Front / Bumper Upper Center', x: 51, y: 13.3, status: 'Normal' },
  { id: 108, displayNumber: '1', name: 'Roof Center Panel', positionLabel: 'Vehicle Centerline / Roof Panel', x: 51, y: 28, status: 'Normal' },
  { id: 109, displayNumber: '3', name: 'Windshield Lower Cowl', positionLabel: 'Vehicle Centerline / Windshield Lower', x: 51, y: 40, status: 'Normal' },
  { id: 110, displayNumber: '1', name: 'Dashboard Inspection Zone', positionLabel: 'Vehicle Interior / Dashboard Front Center', x: 51, y: 55.5, status: 'Normal' },
  { id: 111, displayNumber: '32', name: 'Rear Cabin Floor / Trunk Forward Panel', positionLabel: 'Vehicle Centerline / Rear Cabin Lower', x: 48.5, y: 70.5, status: 'Normal' },
  { id: 112, displayNumber: '62', name: 'Rear Bumper - Upper Center', positionLabel: 'Vehicle Rear / Bumper Upper Center', x: 51, y: 91.5, status: 'Normal' },
  { id: 113, displayNumber: '44', name: 'Rear Bumper - Lower Center', positionLabel: 'Vehicle Rear / Bumper Lower Center', x: 51, y: 104.5, status: 'Normal' },
  { id: 114, displayNumber: '17', name: 'Right Front Fender - Upper Arch', positionLabel: 'Vehicle Right Side / Front Fender Upper', x: 85.5, y: 27, status: 'Abnormal' },
  { id: 115, displayNumber: '18', name: 'Right Front Door - Upper Panel', positionLabel: 'Vehicle Right Side / Front Door Upper', x: 77.5, y: 38, status: 'Abnormal' },
  { id: 116, displayNumber: '18', name: 'Right Front Door - Front Edge', positionLabel: 'Vehicle Right Side / Front Door Leading Edge', x: 70.5, y: 42, status: 'Normal' },
  { id: 117, displayNumber: '28', name: 'Right Rear Door - Mid Panel', positionLabel: 'Vehicle Right Side / Rear Door Mid Panel', x: 77, y: 53, status: 'Abnormal' },
  { id: 118, displayNumber: '28', name: 'Right Rear Quarter - Center Panel', positionLabel: 'Vehicle Right Side / Rear Quarter Center', x: 90.5, y: 53, status: 'Abnormal' },
  { id: 119, displayNumber: '28', name: 'Right Center Sill Panel', positionLabel: 'Vehicle Right Side / Center Sill', x: 69, y: 58.5, status: 'Abnormal' },
  { id: 120, displayNumber: '30', name: 'Right Rear Quarter - Lower Panel', positionLabel: 'Vehicle Right Side / Rear Quarter Lower', x: 76.5, y: 73.5, status: 'Abnormal' },
];

const INITIAL_DATA: ChecklistData = {
  vehicleId: '',
  plate: '',
  makeModel: '',
  odometer: '',
  fuelLevel: 'Full',
  type: '',
  exteriorPoints: EXTERIOR_POINT_METAS.map(({ id, displayNumber, x, y, status }) => ({ id, x, y, label: displayNumber, status, notes: '' })),
  interior: {
    dashboard: '',
    seats: '',
    carpets: '',
    windows: '',
    electronics: '',
    safety: '',
  },
  signature: {
    customerName: '',
    inspectorName: 'John Smith',
    date: new Date().toISOString().split('T')[0],
    signed: false,
  },
};

const steps = [
  { id: 1, name: 'Vehicle Info' },
  { id: 2, name: 'Checklist Type' },
  { id: 3, name: 'Exterior' },
  { id: 4, name: 'Interior' },
  { id: 5, name: 'Tyre' },
  { id: 6, name: 'Signature' },
  { id: 7, name: 'Summary' },
];

const checklistTypes = [
  { id: 'pickup', title: 'Vehicle Pickup Checklist', desc: 'Inspection performed when the customer picks up the vehicle.', icon: Car },
  { id: 'return', title: 'Vehicle Return Checklist', desc: 'Inspection performed when the vehicle is returned.', icon: ClipboardCheck },
  { id: 'maint', title: 'Maintenance Inspection', desc: 'Regular maintenance and service inspection.', icon: PenTool },
  { id: 'damage', title: 'Damage Assessment', desc: 'Detailed inspection for incident or damage reporting.', icon: AlertOctagon },
];

const pointTone = (status?: InspectionStatus): 'success' | 'danger' | 'neutral' => {
  if (status === 'Abnormal') return 'danger';
  if (status === 'Normal') return 'success';
  return 'neutral';
};

const ChecklistManager: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ChecklistData>(INITIAL_DATA);
  const [modalPointId, setModalPointId] = useState<number | null>(null);
  const [recentChecklists, setRecentChecklists] = useState<ChecklistResponse[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSigned, setCustomerSigned] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const stepsRailRef = useRef<HTMLDivElement | null>(null);
  const activeStepRef = useRef<HTMLDivElement | null>(null);

  const updateField = <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateInterior = (key: keyof ChecklistData['interior'], value: string) => {
    setData((prev) => ({
      ...prev,
      interior: {
        ...prev.interior,
        [key]: value,
      },
    }));
  };

  const savePointData = (updatedPoint: InspectionPoint) => {
    setData((prev) => ({
      ...prev,
      exteriorPoints: prev.exteriorPoints.map((point) => (point.id === updatedPoint.id ? updatedPoint : point)),
    }));
    setModalPointId(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadChecklists = async () => {
      try {
        const items = await getChecklists();
        if (!cancelled) {
          setRecentChecklists(items.slice(0, 5));
          setWarning(null);
        }
      } catch {
        if (!cancelled) {
          setWarning('Unable to load checklists from backend.');
        }
      }
    };

    loadChecklists();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeStepRef.current || !stepsRailRef.current) {
      return;
    }

    activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [step]);

  const handleCompleteCheckout = async () => {
    if (!data.vehicleId.trim()) {
      alert('Vehicle ID (UUID) is required before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await apiPost('/api/checklists', {
        checklistNumber: `CHK-${Date.now()}`,
        rentalStartDate: today,
        rentalEndDate: null,
        customerName: data.signature.customerName || 'Walk-in Customer',
        customerPhone: '+0000000000',
        staffName: data.signature.inspectorName || 'Inspector',
        rentalType: (data.type || 'pickup').toUpperCase(),
        vehicleId: data.vehicleId.trim(),
      });
      alert('Inspection checklist submitted successfully.');
    } catch {
      alert('Failed to submit checklist. Ensure Vehicle ID is a valid UUID and required fields are filled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedExterior = data.exteriorPoints.filter((point) => point.status === 'Normal').length;
  const abnormalExterior = data.exteriorPoints.filter((point) => point.status === 'Abnormal').length;
  const latestChecklist = recentChecklists[0];
  const pointMetaById = useMemo(() => Object.fromEntries(EXTERIOR_POINT_METAS.map((meta) => [meta.id, meta])) as Record<number, ExteriorInspectionPointMeta>, []);
  const currentModalPoint = modalPointId ? data.exteriorPoints.find((point) => point.id === modalPointId) || null : null;

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Checklist Management" description="Run a consistent inspection workflow for pickup, return, and maintenance checks." warning={warning} />

      <Card style={{ padding: 12 }}>
        <div className="app-steps-shell">
          <button type="button" className="app-steps-shell__scroll" aria-label="Scroll steps left" onClick={() => stepsRailRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}>
            <ChevronLeft size={16} />
          </button>
          <div className="app-checklist-steps" ref={stepsRailRef}>
            {steps.map((item, index) => {
              const isActive = step === item.id;
              const isDone = step > item.id;
              return (
                <React.Fragment key={item.id}>
                  <div className="app-step" ref={isActive ? activeStepRef : null}>
                    <div className={cx('app-step__marker', isActive && 'app-step__marker--active', isDone && 'app-step__marker--done')}>
                      {isDone ? <CheckCircle size={14} /> : item.id}
                    </div>
                    <span className={isActive ? '' : 'app-muted'} style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                  </div>
                  {index < steps.length - 1 ? <div className={cx('app-step__line', isDone && 'app-step__line--done')} /> : null}
                </React.Fragment>
              );
            })}
          </div>
          <button type="button" className="app-steps-shell__scroll" aria-label="Scroll steps right" onClick={() => stepsRailRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}>
            <ChevronRight size={16} />
          </button>
        </div>
      </Card>

      <div className="app-checklist-layout">
        <Card className="app-checklist-main-card" style={{ padding: 24, minHeight: 540 }}>
          {renderStepContent({ step, data, updateField, updateInterior, setModalPointId, setCustomerSigned, customerSigned, pointMetaById })}
        </Card>

        <aside className={cx('app-checklist-history', historyExpanded && 'app-checklist-history--expanded')}>
          <Card className="app-checklist-history__card">
            <button type="button" className="app-checklist-history__summary" onClick={() => setHistoryExpanded((current) => !current)}>
              <div className="app-user-chip" style={{ alignItems: 'center' }}>
                <div className="app-avatar"><History size={16} /></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>Recent Checklists</div>
                  <div className="app-muted" style={{ fontSize: 12 }}>
                    {recentChecklists.length} items{latestChecklist ? ` · Latest ${latestChecklist.checklistNumber}` : ''}
                  </div>
                </div>
              </div>
              <StatusBadge tone={historyExpanded ? 'inverse' : 'neutral'}>{historyExpanded ? 'Hide' : 'Show'}</StatusBadge>
            </button>

            <div className={cx('app-checklist-history__body', historyExpanded && 'app-checklist-history__body--visible')}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <StatusBadge tone="success">{completedExterior} normal points</StatusBadge>
                <StatusBadge tone={abnormalExterior > 0 ? 'warning' : 'neutral'}>{abnormalExterior} abnormal points</StatusBadge>
              </div>
              <div className="app-note-list">
                {recentChecklists.length === 0 ? (
                  <p className="app-muted" style={{ margin: 0 }}>No checklist records found.</p>
                ) : (
                  recentChecklists.map((item) => (
                    <div key={item.id} className="app-note-row">
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.checklistNumber}</div>
                        <div className="app-muted" style={{ fontSize: 13 }}>{item.staffName || 'Inspector'} | {item.rentalType}</div>
                      </div>
                      <div className="app-muted">{item.vehicle?.plateNumber || '-'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <div className="app-split" style={{ flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
          <ArrowLeft size={16} /> Previous Step
        </Button>
        {step < 7 ? (
          <Button type="button" onClick={() => setStep((current) => Math.min(7, current + 1))}>
            Next Step <ArrowRight size={16} />
          </Button>
        ) : (
          <Button type="button" variant="success" onClick={handleCompleteCheckout} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Complete Check-out'} <CheckCircle size={16} />
          </Button>
        )}
      </div>

      {currentModalPoint ? <PointModal point={currentModalPoint} meta={pointMetaById[currentModalPoint.id]} onClose={() => setModalPointId(null)} onSave={savePointData} /> : null}
    </div>
  );
};

type StepRendererProps = {
  step: number;
  data: ChecklistData;
  updateField: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void;
  updateInterior: (key: keyof ChecklistData['interior'], value: string) => void;
  setModalPointId: React.Dispatch<React.SetStateAction<number | null>>;
  setCustomerSigned: React.Dispatch<React.SetStateAction<boolean>>;
  customerSigned: boolean;
  pointMetaById: Record<number, ExteriorInspectionPointMeta>;
};

const renderStepContent = ({ step, data, updateField, updateInterior, setModalPointId, setCustomerSigned, customerSigned, pointMetaById }: StepRendererProps) => {
  switch (step) {
    case 1:
      return <StepInfo data={data} onChange={updateField} />;
    case 2:
      return <StepType selected={data.type} onSelect={(value) => updateField('type', value)} />;
    case 3:
      return <StepExterior points={data.exteriorPoints} pointMetaById={pointMetaById} onPointClick={(point) => setModalPointId(point.id)} />;
    case 4:
      return <StepInterior data={data} onChange={updateInterior} />;
    case 5:
      return <StepTyres />;
    case 6:
      return <StepSignature data={data} onChange={updateField} signed={customerSigned} onToggleSigned={setCustomerSigned} />;
    case 7:
      return <StepSummary data={data} signed={customerSigned} pointMetaById={pointMetaById} />;
    default:
      return null;
  }
};

const StepInfo = ({ data, onChange }: { data: ChecklistData; onChange: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void; }) => (
  <div className="app-grid" style={{ gap: 24 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Vehicle Information</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>Capture the core reference details before starting the inspection.</p>
    </div>
    <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <FormField label="Vehicle ID"><TextInput value={data.vehicleId} onChange={(e) => onChange('vehicleId', e.target.value)} placeholder="Enter vehicle ID" /></FormField>
      <FormField label="License Plate"><TextInput value={data.plate} onChange={(e) => onChange('plate', e.target.value)} placeholder="Enter license plate" /></FormField>
      <FormField label="Make & Model"><TextInput value={data.makeModel} onChange={(e) => onChange('makeModel', e.target.value)} placeholder="Toyota Camry" /></FormField>
      <FormField label="Current Odometer (km)"><TextInput value={data.odometer} onChange={(e) => onChange('odometer', e.target.value)} placeholder="45000" /></FormField>
      <FormField label="Check-out Date"><TextInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></FormField>
      <FormField label="Fuel Level">
        <SelectInput value={data.fuelLevel} onChange={(e) => onChange('fuelLevel', e.target.value)}>
          <option>Full</option>
          <option>3/4</option>
          <option>1/2</option>
          <option>1/4</option>
          <option>Empty</option>
        </SelectInput>
      </FormField>
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label="Customer Details"><TextArea placeholder="Enter name, contact information, and rental notes..." /></FormField>
      </div>
    </div>
  </div>
);

const StepType = ({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) => (
  <div className="app-grid" style={{ gap: 16, maxWidth: 860 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Select checklist type</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>Choose the inspection workflow that matches the current operation.</p>
    </div>
    {checklistTypes.map((item) => {
      const Icon = item.icon;
      return (
        <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={cx('app-radio-card', selected === item.id && 'app-radio-card--selected')}>
          <div className="app-avatar"><Icon size={18} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div className="app-muted" style={{ fontSize: 13, marginTop: 4 }}>{item.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><StatusBadge tone={selected === item.id ? 'inverse' : 'neutral'}>{selected === item.id ? 'Selected' : 'Select'}</StatusBadge></div>
        </button>
      );
    })}
  </div>
);

const StepExterior = ({ points, pointMetaById, onPointClick }: { points: InspectionPoint[]; pointMetaById: Record<number, ExteriorInspectionPointMeta>; onPointClick: (point: InspectionPoint) => void; }) => (
  <div className="app-grid" style={{ gap: 24 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Exterior Inspection</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>Inspect each numbered exterior zone and record its condition.</p>
    </div>
    <div className="app-exterior-stage">
      <div className="app-exterior-stage__canvas">
        <img src="/car_damage_map_pixel_perfect.svg" alt="Exterior inspection vehicle map" className="app-exterior-vehicle" />
        {points.map((point) => {
          const meta = pointMetaById[point.id];
          return <button key={point.id} type="button" className={cx('app-exterior-point', `app-exterior-point--${pointTone(point.status)}`)} style={{ left: `${meta.x}%`, top: `${meta.y}%` }} onClick={() => onPointClick(point)} aria-label={`${meta.name} (${meta.displayNumber})`} title={meta.name}>{meta.displayNumber}</button>;
        })}
      </div>
    </div>
  </div>
);

const PointModal = ({ point, meta, onClose, onSave }: { point: InspectionPoint; meta: ExteriorInspectionPointMeta; onClose: () => void; onSave: (point: InspectionPoint) => void; }) => {
  const [status, setStatus] = useState<InspectionStatus>(point.status || 'Normal');
  const [notes, setNotes] = useState(point.notes || '');

  return (
    <ModalShell
      title={meta.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave({ ...point, status, notes })}>Save Inspection</Button>
        </>
      }
    >
      <div className="app-grid" style={{ gap: 16 }}>
        <FormField label="Position"><TextInput value={meta.positionLabel} readOnly /></FormField>
        <div>
          <div className="app-label" style={{ marginBottom: 10 }}>Condition Status</div>
          <div className="app-modal-status-grid">
            {(['Normal', 'Abnormal', 'N/A', 'Not Inspected'] as InspectionStatus[]).map((option) => (
              <button key={option} type="button" className={cx('app-modal-status-card', status === option && 'app-modal-status-card--active')} onClick={() => setStatus(option)}>
                <span className="app-modal-status-card__dot" />
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
        <FormField label="Notes"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add detailed inspection notes..." /></FormField>
        <div>
          <div className="app-label" style={{ marginBottom: 10 }}>Photos</div>
          <div className="app-photo-dropzone">
            <Camera size={20} />
            <span className="app-muted" style={{ fontSize: 13 }}>Drag photos here or click to browse</span>
            <Button type="button" variant="secondary" size="sm">Add Photo</Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const StepInterior = ({ data, onChange }: { data: ChecklistData; onChange: (key: keyof ChecklistData['interior'], value: string) => void; }) => {
  const sections: Array<{ key: keyof ChecklistData['interior']; label: string }> = [
    { key: 'dashboard', label: 'Dashboard & Controls' },
    { key: 'seats', label: 'Seats & Upholstery' },
    { key: 'carpets', label: 'Floor Mats & Carpets' },
    { key: 'windows', label: 'Windows & Mirrors' },
    { key: 'electronics', label: 'Electronics & Audio' },
    { key: 'safety', label: 'Safety Equipment' },
  ];

  return (
    <div className="app-grid" style={{ gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 22 }}>Interior Components</h3>
        <p className="app-section-description" style={{ marginTop: 8 }}>Record notes for interior systems, trim, and safety equipment.</p>
      </div>
      {sections.map((section) => (
        <div key={section.key} className="app-surface-muted" style={{ padding: 16 }}>
          <div className="app-split" style={{ alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{section.label}</div>
            <Button variant="ghost" size="sm" type="button"><Camera size={14} /> Photo</Button>
          </div>
          <FormField label="Inspection notes"><TextInput value={data.interior[section.key]} onChange={(e) => onChange(section.key, e.target.value)} placeholder="Add notes or observations..." /></FormField>
        </div>
      ))}
    </div>
  );
};

const StepTyres = () => (
  <div className="app-grid" style={{ gap: 16, placeItems: 'center', textAlign: 'center', padding: '48px 0' }}>
    <div className="app-avatar" style={{ width: 56, height: 56 }}><Shield size={24} /></div>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Tyre Inspection</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>All tyres are currently recorded as in good condition for this demo workflow.</p>
    </div>
    <StatusBadge tone="success">Good Condition</StatusBadge>
  </div>
);

const StepSignature = ({ data, onChange, signed, onToggleSigned }: { data: ChecklistData; onChange: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void; signed: boolean; onToggleSigned: React.Dispatch<React.SetStateAction<boolean>>; }) => (
  <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
    <div className="app-grid" style={{ gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 22 }}>Digital Signature</h3>
        <p className="app-section-description" style={{ marginTop: 8 }}>Capture customer acknowledgement and inspector sign-off.</p>
      </div>
      <div>
        <div className="app-label" style={{ marginBottom: 10 }}>Customer Signature</div>
        <button type="button" className="app-signature" onClick={() => onToggleSigned((value) => !value)}>
          {signed ? <span className="app-script" style={{ fontSize: 34 }}>John Doe</span> : <span className="app-muted">Click to simulate signing</span>}
        </button>
      </div>
      <div>
        <div className="app-label" style={{ marginBottom: 10 }}>Inspector Signature</div>
        <div className="app-signature"><span className="app-script" style={{ fontSize: 28, color: '#52525b' }}>{data.signature.inspectorName}</span></div>
      </div>
    </div>
    <div className="app-grid" style={{ gap: 16 }}>
      <FormField label="Customer Full Name"><TextInput value={data.signature.customerName} onChange={(e) => onChange('signature', { ...data.signature, customerName: e.target.value, signed })} placeholder="Customer full name" /></FormField>
      <FormField label="Customer ID / License"><TextInput placeholder="Enter customer ID or license" /></FormField>
      <FormField label="Inspector"><TextInput value={`Inspector: ${data.signature.inspectorName}`} readOnly /></FormField>
      <FormField label="Date"><TextInput value={new Date().toLocaleString()} readOnly /></FormField>
      <div className="app-surface-muted" style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
        <strong>Terms & Conditions</strong>
        <p style={{ margin: '8px 0 0' }}>By signing, the customer acknowledges the vehicle condition as inspected above and agrees to return the vehicle in the same condition.</p>
      </div>
    </div>
  </div>
);

const StepSummary = ({ data, signed, pointMetaById }: { data: ChecklistData; signed: boolean; pointMetaById: Record<number, ExteriorInspectionPointMeta>; }) => {
  const abnormalPoints = data.exteriorPoints.filter((point) => point.status === 'Abnormal').length;
  const notableIssues = data.exteriorPoints.filter((point) => point.status === 'Abnormal').slice(0, 3);
  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <div className="app-split" style={{ flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 22 }}>Inspection Summary</h3>
          <p className="app-section-description" style={{ marginTop: 8 }}>Final review of the vehicle record, inspection results, and signatures.</p>
        </div>
        <StatusBadge tone={abnormalPoints > 0 ? 'warning' : 'success'}>{abnormalPoints > 0 ? 'Review Required' : 'Approved for Rental'}</StatusBadge>
      </div>
      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="app-surface-muted" style={{ padding: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Vehicle Information</h4>
          <div className="app-note-list">
            <div className="app-note-row"><span className="app-muted">ID</span><strong>{data.vehicleId || 'RNT-001'}</strong></div>
            <div className="app-note-row"><span className="app-muted">Model</span><strong>{data.makeModel || 'Toyota Camry'}</strong></div>
            <div className="app-note-row"><span className="app-muted">Fuel</span><strong>{data.fuelLevel}</strong></div>
          </div>
        </div>
        <div className="app-surface-muted" style={{ padding: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Inspection Results</h4>
          <div className="app-note-list">
            <div className="app-note-row"><span>Exterior</span><StatusBadge tone={abnormalPoints > 0 ? 'warning' : 'success'}>{abnormalPoints > 0 ? 'Minor Issues' : 'Passed'}</StatusBadge></div>
            <div className="app-note-row"><span>Interior</span><StatusBadge tone="neutral">Captured</StatusBadge></div>
            <div className="app-note-row"><span>Tyres</span><StatusBadge tone="success">Passed</StatusBadge></div>
          </div>
        </div>
      </div>
      {notableIssues.length > 0 ? <div className="app-surface-muted" style={{ padding: 16 }}><h4 style={{ margin: '0 0 12px' }}>Exterior Notes Requiring Review</h4><div className="app-note-list">{notableIssues.map((point) => <div key={point.id} className="app-note-row"><span>{pointMetaById[point.id].name}</span><StatusBadge tone="warning">{point.notes || 'Marked abnormal'}</StatusBadge></div>)}</div></div> : null}
      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <h4 style={{ margin: '0 0 12px' }}>Signatures</h4>
          <div className="app-signature" style={{ minHeight: 132, flexDirection: 'column', gap: 8 }}><span className="app-script" style={{ fontSize: 32 }}>{signed ? 'John Doe' : 'Pending signature'}</span><span className="app-muted" style={{ fontSize: 12 }}>Customer Signature</span></div>
        </div>
        <div>
          <h4 style={{ margin: '0 0 12px' }}>Photos Attached</h4>
          <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="app-signature" style={{ minHeight: 96 }}><span className="app-muted">Exterior Front</span></div>
            <div className="app-signature" style={{ minHeight: 96 }}><span className="app-muted">Dashboard</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistManager;

