import * as Select from '@radix-ui/react-select';
import type { ReactNode } from 'react';

export type MmSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MmSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: MmSelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  required?: boolean;
};

function ChevronIcon() {
  return (
    <Select.Icon className="mm-select-icon" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path
          d="M3 4.5 6 8 9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Select.Icon>
  );
}

export function MmSelect({
  value,
  onValueChange,
  options,
  placeholder = '— Seleccionar —',
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
  required,
}: MmSelectProps) {
  const radixValue = value === '' ? undefined : value;

  return (
    <Select.Root
      value={radixValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <Select.Trigger
        id={id}
        className={['mm-select-trigger', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      >
        <Select.Value placeholder={placeholder} className="mm-select-value" />
        <ChevronIcon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="mm-select-content"
          position="popper"
          side="bottom"
          sideOffset={6}
          align="start"
          avoidCollisions
        >
          <Select.Viewport className="mm-select-viewport">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({
  value,
  disabled,
  children,
}: {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Select.Item
      value={value}
      disabled={disabled}
      className="mm-select-item"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="mm-select-item-indicator">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Select.ItemIndicator>
    </Select.Item>
  );
}
