import * as Popover from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { DayPicker, useDayPicker, type MonthCaptionProps } from 'react-day-picker';
import {
  formatDateDisplay,
  parseIsoDateLocal,
  toIsoDateLocal,
} from '../../lib/date-iso';

type MmDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  min?: string;
  max?: string;
};

const dayPickerComponents = { MonthCaption: MmMonthCaption };

function MmMonthCaption({ calendarMonth, className, ...divProps }: MonthCaptionProps) {
  const {
    previousMonth,
    nextMonth,
    goToMonth,
    classNames,
    components,
    labels,
  } = useDayPicker();

  const {
    PreviousMonthButton,
    NextMonthButton,
    Chevron,
    CaptionLabel,
  } = components;

  const caption = format(calendarMonth.date, 'LLLL yyyy', { locale: es });

  return (
    <div
      {...divProps}
      className={['mm-dp-caption', className].filter(Boolean).join(' ')}
    >
      <PreviousMonthButton
        type="button"
        className={classNames.button_previous}
        tabIndex={previousMonth ? undefined : -1}
        aria-disabled={previousMonth ? undefined : true}
        aria-label={labels.labelPrevious(previousMonth)}
        onClick={() => {
          if (previousMonth) goToMonth(previousMonth);
        }}
      >
        <Chevron
          disabled={previousMonth ? undefined : true}
          className={classNames.chevron}
          orientation="left"
          size={16}
        />
      </PreviousMonthButton>
      <CaptionLabel
        className={classNames.caption_label}
        role="status"
        aria-live="polite"
      >
        {caption}
      </CaptionLabel>
      <NextMonthButton
        type="button"
        className={classNames.button_next}
        tabIndex={nextMonth ? undefined : -1}
        aria-disabled={nextMonth ? undefined : true}
        aria-label={labels.labelNext(nextMonth)}
        onClick={() => {
          if (nextMonth) goToMonth(nextMonth);
        }}
      >
        <Chevron
          disabled={nextMonth ? undefined : true}
          className={classNames.chevron}
          orientation="right"
          size={16}
        />
      </NextMonthButton>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="mm-date-picker-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 3v3M16 3v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MmDatePicker({
  value,
  onChange,
  id,
  disabled,
  required,
  placeholder = 'Seleccionar fecha',
  className,
  'aria-label': ariaLabel,
  min,
  max,
}: MmDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIsoDateLocal(value), [value]);
  const display = value ? formatDateDisplay(value) : '';

  const fromDate = min ? parseIsoDateLocal(min) : undefined;
  const toDate = max ? parseIsoDateLocal(max) : undefined;

  const pick = (date: Date | undefined) => {
    if (!date) return;
    onChange(toIsoDateLocal(date));
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {required ? (
        <input
          type="text"
          className="mm-date-picker-native-required"
          value={value}
          required
          tabIndex={-1}
          aria-hidden
          readOnly
          onChange={() => {}}
        />
      ) : null}
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          className={[
            'mm-select-trigger',
            'mm-date-picker-trigger',
            !display ? 'mm-date-picker-trigger--empty' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="mm-select-value">
            {display || (
              <span className="mm-date-picker-placeholder">{placeholder}</span>
            )}
          </span>
          <CalendarIcon />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="mm-date-picker-content"
          side="bottom"
          sideOffset={6}
          align="start"
          avoidCollisions
        >
          <DayPicker
            mode="single"
            locale={es}
            weekStartsOn={1}
            hideNavigation
            components={dayPickerComponents}
            showOutsideDays
            selected={selected}
            onSelect={pick}
            defaultMonth={selected}
            startMonth={fromDate}
            endMonth={toDate}
            disabled={[
              ...(fromDate ? [{ before: fromDate }] : []),
              ...(toDate ? [{ after: toDate }] : []),
            ]}
            classNames={{
              root: 'mm-dp',
              months: 'mm-dp-months',
              month: 'mm-dp-month',
              month_caption: 'mm-dp-caption',
              caption_label: 'mm-dp-caption-label',
              chevron: 'mm-dp-chevron',
              button_previous: 'mm-dp-nav-btn',
              button_next: 'mm-dp-nav-btn',
              weekdays: 'mm-dp-weekdays',
              weekday: 'mm-dp-weekday',
              weeks: 'mm-dp-weeks',
              week: 'mm-dp-week',
              day: 'mm-dp-day',
              day_button: 'mm-dp-day-btn',
              selected: 'mm-dp-day--selected',
              today: 'mm-dp-day--today',
              outside: 'mm-dp-day--outside',
              disabled: 'mm-dp-day--disabled',
            }}
          />
          <footer className="mm-date-picker-footer">
            <button
              type="button"
              className="mm-date-picker-footer-btn"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="mm-date-picker-footer-btn mm-date-picker-footer-btn--primary"
              onClick={() => pick(new Date())}
            >
              Hoy
            </button>
          </footer>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
