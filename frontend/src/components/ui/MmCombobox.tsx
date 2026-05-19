import * as Popover from '@radix-ui/react-popover';
import { useId, useMemo } from 'react';
import { MmInput } from './MmInput';

export type MmComboboxOption = {
  value: string;
  label: string;
};

type MmComboboxProps = {
  query: string;
  onQueryChange: (query: string) => void;
  options: MmComboboxOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  'aria-label'?: string;
};

export function MmCombobox({
  query,
  onQueryChange,
  options,
  onSelect,
  placeholder = 'Buscar…',
  emptyMessage = 'Sin resultados.',
  id,
  disabled,
  className,
  inputClassName,
  'aria-label': ariaLabel,
}: MmComboboxProps) {
  const listId = useId();
  const open = useMemo(() => query.trim().length > 0, [query]);

  return (
    <Popover.Root open={open && !disabled}>
      <div className={['mm-combobox-anchor', className].filter(Boolean).join(' ')}>
        <Popover.Anchor asChild>
          <div>
            <MmInput
              id={id}
              type="search"
              className={inputClassName}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              aria-label={ariaLabel}
              aria-controls={listId}
              aria-expanded={open}
              aria-autocomplete="list"
              role="combobox"
            />
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            id={listId}
            className="mm-combobox-content"
            side="bottom"
            sideOffset={6}
            align="start"
            avoidCollisions
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {options.length === 0 ? (
              <p className="mm-combobox-empty" role="status">
                {emptyMessage}
              </p>
            ) : (
              <ul
                className="mm-combobox-list"
                role="listbox"
                style={{ listStyle: 'none', margin: 0, padding: 0 }}
              >
                {options.map((opt) => (
                  <li key={opt.value} role="option">
                    <button
                      type="button"
                      className="mm-combobox-item"
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        font: 'inherit',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
