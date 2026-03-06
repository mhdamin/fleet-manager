import React from 'react';

type ClassValue = string | false | null | undefined;

const cx = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');

const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}) => (
  <button
    {...props}
    className={cx(
      'app-button',
      `app-button--${variant}`,
      size === 'sm' ? 'app-button--sm' : 'app-button--md',
      className
    )}
  >
    {children}
  </button>
);

const IconButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={cx('app-icon-button', className)}>
    {children}
  </button>
);

const Card = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cx('app-card', className)}>
    {children}
  </div>
);

const SectionHeader = ({
  title,
  description,
  action,
  warning,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  warning?: string | null;
}) => (
  <div className="app-section-header">
    <div>
      <h2 className="app-section-title">{title}</h2>
      <p className="app-section-description">{description}</p>
      {warning ? <p className="app-warning-text">{warning}</p> : null}
    </div>
    {action ? <div className="app-section-action">{action}</div> : null}
  </div>
);

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) => (
  <Card className="app-stat-card">
    <div>
      <p className="app-stat-label">{label}</p>
      <p className="app-stat-value">{value}</p>
    </div>
    {icon ? <div className="app-stat-icon">{icon}</div> : null}
  </Card>
);

const StatusBadge = ({
  children,
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'inverse';
}) => <span {...props} className={cx('app-badge', `app-badge--${tone}`, className)}>{children}</span>;

const FormField = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <label className="app-field" htmlFor={htmlFor}>
    <span className="app-label">{label}</span>
    {children}
  </label>
);

const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} {...props} className={cx('app-input', className)} />
);

TextInput.displayName = 'TextInput';

const SelectInput = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} {...props} className={cx('app-input app-select', className)}>
      {children}
    </select>
  )
);

SelectInput.displayName = 'SelectInput';

const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} {...props} className={cx('app-input app-textarea', className)} />
);

TextArea.displayName = 'TextArea';

const ModalShell = ({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <div className="app-modal-backdrop">
    <div className="app-modal">
      <div className="app-modal__header">
        <h3>{title}</h3>
        <IconButton aria-label="Close modal" onClick={onClose} type="button">
          <span aria-hidden="true">×</span>
        </IconButton>
      </div>
      <div className="app-modal__body">{children}</div>
      {footer ? <div className="app-modal__footer">{footer}</div> : null}
    </div>
  </div>
);

const TableCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <Card className={cx('app-table-card', className)}>{children}</Card>;

export {
  Button,
  Card,
  FormField,
  IconButton,
  ModalShell,
  SectionHeader,
  SelectInput,
  StatCard,
  StatusBadge,
  TableCard,
  TextArea,
  TextInput,
  cx,
};

