import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  CheckCircle,
  ClipboardCheck,
  PenTool,
  Shield,
} from 'lucide-react';
import { Button, Card, FormField, ModalShell, SectionHeader, SelectInput, StatusBadge, TextArea, TextInput, cx } from '../AppUI';
import { apiPost, getChecklists, type ChecklistResponse } from '../../services/api';
import { ChecklistData, InspectionPoint } from '../../types';

const INITIAL_POINTS: InspectionPoint[] = [
  { id: 1, x: 50, y: 35, label: '1', status: 'Normal' },
  { id: 3, x: 50, y: 50, label: '3', status: 'Normal' },
  { id: 32, x: 50, y: 65, label: '32', status: 'Normal' },
  { id: 17, x: 32, y: 45, label: '17', status: 'Normal' },
  { id: 18, x: 68, y: 45, label: '18', status: 'Normal' },
  { id: 51, x: 28, y: 55, label: '51', status: 'Abnormal' },
  { id: 28, x: 72, y: 55, label: '28', status: 'Abnormal' },
  { id: 5, x: 50, y: 15, label: '5', status: 'Normal' },
  { id: 44, x: 50, y: 85, label: '44', status: 'Normal' },
];

const INITIAL_DATA: ChecklistData = {
  vehicleId: '',
  plate: '',
  makeModel: '',
  odometer: '',
  fuelLevel: 'Full',
  type: '',
  exteriorPoints: INITIAL_POINTS,
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
  { id: 5, name: 'Tyres' },
  { id: 6, name: 'Signature' },
  { id: 7, name: 'Summary' },
];

const checklistTypes = [
  { id: 'pickup', title: 'Vehicle Pickup Checklist', desc: 'Inspection performed when the customer picks up the vehicle.', icon: Car },
  { id: 'return', title: 'Vehicle Return Checklist', desc: 'Inspection performed when the vehicle is returned.', icon: ClipboardCheck },
  { id: 'maint', title: 'Maintenance Inspection', desc: 'Regular maintenance and service inspection.', icon: PenTool },
  { id: 'damage', title: 'Damage Assessment', desc: 'Detailed inspection for incident or damage reporting.', icon: AlertOctagon },
];

const pointTone = (status?: InspectionPoint['status']): 'success' | 'danger' | 'neutral' => {
  if (status === 'Abnormal') {
    return 'danger';
  }
  if (status === 'Normal') {
    return 'success';
  }
  return 'neutral';
};

const ChecklistManager: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ChecklistData>(INITIAL_DATA);
  const [modalPoint, setModalPoint] = useState<InspectionPoint | null>(null);
  const [recentChecklists, setRecentChecklists] = useState<ChecklistResponse[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSigned, setCustomerSigned] = useState(false);

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
    setModalPoint(null);
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

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Checklist Management"
        description="Run a consistent inspection workflow for pickup, return, and maintenance checks."
        warning={warning}
      />

      <Card style={{ padding: 16 }}>
        <div className="app-checklist-steps">
          {steps.map((item, index) => (
            <React.Fragment key={item.id}>
              <div className="app-step">
                <div
                  className={cx(
                    'app-step__marker',
                    step === item.id && 'app-step__marker--active',
                    step > item.id && 'app-step__marker--done'
                  )}
                >
                  {step > item.id ? <CheckCircle size={14} /> : item.id}
                </div>
                <span className={step === item.id ? '' : 'app-muted'} style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
              </div>
              {index < steps.length - 1 ? <div className={cx('app-step__line', step > item.id && 'app-step__line--done')} /> : null}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 24, minHeight: 540 }}>{renderStepContent({ step, data, updateField, updateInterior, setModalPoint, setCustomerSigned, customerSigned })}</Card>

      <Card style={{ padding: 20 }}>
        <div className="app-split" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Recent Checklists</h3>
            <p className="app-section-description" style={{ marginTop: 6 }}>Latest records fetched from the backend.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge tone="success">{completedExterior} normal points</StatusBadge>
            <StatusBadge tone={abnormalExterior > 0 ? 'warning' : 'neutral'}>{abnormalExterior} abnormal points</StatusBadge>
          </div>
        </div>
        <div className="app-note-list" style={{ marginTop: 16 }}>
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
      </Card>

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

      {modalPoint ? <PointModal point={modalPoint} onClose={() => setModalPoint(null)} onSave={savePointData} /> : null}
    </div>
  );
};

type StepRendererProps = {
  step: number;
  data: ChecklistData;
  updateField: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void;
  updateInterior: (key: keyof ChecklistData['interior'], value: string) => void;
  setModalPoint: React.Dispatch<React.SetStateAction<InspectionPoint | null>>;
  setCustomerSigned: React.Dispatch<React.SetStateAction<boolean>>;
  customerSigned: boolean;
};

const renderStepContent = ({
  step,
  data,
  updateField,
  updateInterior,
  setModalPoint,
  setCustomerSigned,
  customerSigned,
}: StepRendererProps) => {
  switch (step) {
    case 1:
      return <StepInfo data={data} onChange={updateField} />;
    case 2:
      return <StepType selected={data.type} onSelect={(value) => updateField('type', value)} />;
    case 3:
      return <StepExterior points={data.exteriorPoints} onPointClick={setModalPoint} />;
    case 4:
      return <StepInterior data={data} onChange={updateInterior} />;
    case 5:
      return <StepTyres />;
    case 6:
      return (
        <StepSignature
          data={data}
          onChange={updateField}
          signed={customerSigned}
          onToggleSigned={setCustomerSigned}
        />
      );
    case 7:
      return <StepSummary data={data} signed={customerSigned} />;
    default:
      return null;
  }
};

const StepInfo = ({
  data,
  onChange,
}: {
  data: ChecklistData;
  onChange: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void;
}) => (
  <div className="app-grid" style={{ gap: 24 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Vehicle Information</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>Capture the core reference details before starting the inspection.</p>
    </div>
    <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <FormField label="Vehicle ID">
        <TextInput value={data.vehicleId} onChange={(e) => onChange('vehicleId', e.target.value)} placeholder="Enter vehicle ID" />
      </FormField>
      <FormField label="License Plate">
        <TextInput value={data.plate} onChange={(e) => onChange('plate', e.target.value)} placeholder="Enter license plate" />
      </FormField>
      <FormField label="Make & Model">
        <TextInput value={data.makeModel} onChange={(e) => onChange('makeModel', e.target.value)} placeholder="Toyota Camry" />
      </FormField>
      <FormField label="Current Odometer (km)">
        <TextInput value={data.odometer} onChange={(e) => onChange('odometer', e.target.value)} placeholder="45000" />
      </FormField>
      <FormField label="Check-out Date">
        <TextInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </FormField>
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
        <FormField label="Customer Details">
          <TextArea placeholder="Enter name, contact information, and rental notes..." />
        </FormField>
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
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cx('app-radio-card', selected === item.id && 'app-radio-card--selected')}
        >
          <div className="app-avatar"><Icon size={18} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div className="app-muted" style={{ fontSize: 13, marginTop: 4 }}>{item.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <StatusBadge tone={selected === item.id ? 'inverse' : 'neutral'}>{selected === item.id ? 'Selected' : 'Select'}</StatusBadge>
          </div>
        </button>
      );
    })}
  </div>
);

const StepExterior = ({ points, onPointClick }: { points: InspectionPoint[]; onPointClick: (point: InspectionPoint) => void }) => (
  <div className="app-grid" style={{ gap: 24 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 22 }}>Exterior Inspection</h3>
      <p className="app-section-description" style={{ marginTop: 8 }}>Tap each inspection point to record its condition and notes.</p>
    </div>
    <div className="app-grid" style={{ gridTemplateColumns: 'minmax(280px, 360px) minmax(260px, 1fr)', alignItems: 'start' }}>
      <div style={{ margin: '0 auto', position: 'relative', width: 320, height: 500 }} className="app-surface-muted">
        <div style={{ position: 'absolute', inset: 24 }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 160, height: 32, border: '1px solid var(--border-strong)', borderRadius: 16, background: '#fff' }} />
          <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', width: 190, height: 110, border: '1px solid var(--border-strong)', borderRadius: 24, background: '#fff' }} />
          <div style={{ position: 'absolute', top: 160, left: '50%', transform: 'translateX(-50%)', width: 170, height: 150, border: '1px solid var(--border-strong)', borderRadius: 22, background: '#fff' }} />
          <div style={{ position: 'absolute', top: 320, left: '50%', transform: 'translateX(-50%)', width: 190, height: 96, border: '1px solid var(--border-strong)', borderRadius: 24, background: '#fff' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 160, height: 32, border: '1px solid var(--border-strong)', borderRadius: 16, background: '#fff' }} />
          <div style={{ position: 'absolute', top: 100, left: 0, width: 28, height: 240, border: '1px solid var(--border-strong)', borderRadius: 18, background: '#fff' }} />
          <div style={{ position: 'absolute', top: 100, right: 0, width: 28, height: 240, border: '1px solid var(--border-strong)', borderRadius: 18, background: '#fff' }} />
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              onClick={() => onPointClick(point)}
              style={{
                position: 'absolute',
                top: `${point.y}%`,
                left: `${point.x}%`,
                transform: 'translate(-50%, -50%)',
                width: 34,
                height: 34,
              }}
            >
              <StatusBadge tone={pointTone(point.status)} className="!justify-center">{point.id}</StatusBadge>
            </button>
          ))}
        </div>
      </div>
      <div className="app-grid" style={{ gap: 12 }}>
        {points.map((point) => (
          <div key={point.id} className="app-note-row" style={{ paddingBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Inspection Point #{point.id}</div>
              <div className="app-muted" style={{ fontSize: 13 }}>{point.notes || 'No notes recorded yet.'}</div>
            </div>
            <StatusBadge tone={pointTone(point.status)}>{point.status || 'Not set'}</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PointModal = ({
  point,
  onClose,
  onSave,
}: {
  point: InspectionPoint;
  onClose: () => void;
  onSave: (point: InspectionPoint) => void;
}) => {
  const [status, setStatus] = useState<InspectionPoint['status']>(point.status || 'Normal');
  const [notes, setNotes] = useState(point.notes || '');

  return (
    <ModalShell
      title={`Inspection Point #${point.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave({ ...point, status, notes })}>Save Inspection</Button>
        </>
      }
    >
      <div className="app-grid" style={{ gap: 16 }}>
        <div>
          <div className="app-label" style={{ marginBottom: 10 }}>Condition Status</div>
          <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {(['Normal', 'Abnormal', 'N/A', 'Not Inspected'] as Array<InspectionPoint['status']>).map((option) => (
              <button
                key={option}
                type="button"
                className={cx('app-radio-card', status === option && 'app-radio-card--selected')}
                onClick={() => setStatus(option)}
              >
                <StatusBadge tone={pointTone(option)}>{option}</StatusBadge>
              </button>
            ))}
          </div>
        </div>
        <FormField label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add detailed inspection notes..." />
        </FormField>
        <div>
          <div className="app-label" style={{ marginBottom: 10 }}>Photos</div>
          <div className="app-signature" style={{ minHeight: 120, flexDirection: 'column', gap: 8 }}>
            <Camera size={20} />
            <span className="app-muted" style={{ fontSize: 13 }}>Drag photos here or click to browse</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const StepInterior = ({
  data,
  onChange,
}: {
  data: ChecklistData;
  onChange: (key: keyof ChecklistData['interior'], value: string) => void;
}) => {
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
          <FormField label="Inspection notes">
            <TextInput value={data.interior[section.key]} onChange={(e) => onChange(section.key, e.target.value)} placeholder="Add notes or observations..." />
          </FormField>
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

const StepSignature = ({
  data,
  onChange,
  signed,
  onToggleSigned,
}: {
  data: ChecklistData;
  onChange: <K extends keyof ChecklistData>(field: K, value: ChecklistData[K]) => void;
  signed: boolean;
  onToggleSigned: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
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
        <div className="app-signature">
          <span className="app-script" style={{ fontSize: 28, color: '#52525b' }}>{data.signature.inspectorName}</span>
        </div>
      </div>
    </div>
    <div className="app-grid" style={{ gap: 16 }}>
      <FormField label="Customer Full Name">
        <TextInput
          value={data.signature.customerName}
          onChange={(e) => onChange('signature', { ...data.signature, customerName: e.target.value, signed })}
          placeholder="Customer full name"
        />
      </FormField>
      <FormField label="Customer ID / License">
        <TextInput placeholder="Enter customer ID or license" />
      </FormField>
      <FormField label="Inspector">
        <TextInput value={`Inspector: ${data.signature.inspectorName}`} readOnly />
      </FormField>
      <FormField label="Date">
        <TextInput value={new Date().toLocaleString()} readOnly />
      </FormField>
      <div className="app-surface-muted" style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
        <strong>Terms & Conditions</strong>
        <p style={{ margin: '8px 0 0' }}>
          By signing, the customer acknowledges the vehicle condition as inspected above and agrees to return the vehicle in the same condition.
        </p>
      </div>
    </div>
  </div>
);

const StepSummary = ({ data, signed }: { data: ChecklistData; signed: boolean }) => {
  const abnormalPoints = data.exteriorPoints.filter((point) => point.status === 'Abnormal').length;
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
      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <h4 style={{ margin: '0 0 12px' }}>Signatures</h4>
          <div className="app-signature" style={{ minHeight: 132, flexDirection: 'column', gap: 8 }}>
            <span className="app-script" style={{ fontSize: 32 }}>{signed ? 'John Doe' : 'Pending signature'}</span>
            <span className="app-muted" style={{ fontSize: 12 }}>Customer Signature</span>
          </div>
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
