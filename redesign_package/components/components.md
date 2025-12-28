# Component Specifications

## 1. KPICard
**Description**: displays a key metric with a trend indicator.
**Props**:
- `label` (string): Title of the metric.
- `value` (string/number): Main value to display.
- `trend` (object): `{ value: number, direction: 'up' | 'down' }`.
- `icon` (ReactNode): Icon to display.
- `color` (string): 'primary' | 'secondary' | 'success' | 'warning'.

**Accessibility**:
- `role="article"`
- Trend arrow should have `aria-label="Trending up by 12%"` etc.

## 2. DataTable (Server-Side)
**Description**: A reusable table with pagination, sorting, and selection.
**Props**:
- `columns` (array): header definitions.
- `data` (array): row data.
- `onSort` (function): handler for column header click.
- `onPageChange` (function): handler for pagination.
- `selectedIds` (array): list of selected row IDs.
- `isLoading` (boolean): shows skeleton state.

**Accessibility**:
- `aria-rowcount`, `aria-rowindex`.
- Checkboxes must have `aria-label="Select row order #1234"`.

## 3. SlideOver
**Description**: A right-side drawer for details or forms.
**Props**:
- `isOpen` (boolean).
- `onClose` (function).
- `title` (string).
- `children` (ReactNode).
- `footerActions` (ReactNode): Buttons to stick at bottom.

**Accessibility**:
- Focus trap inside the drawer.
- `ESC` key closable.
- `role="dialog"`, `aria-modal="true"`.

## 4. ProductVariantMatrix
**Description**: Grid input for SKU management.
**Props**:
- `xOptions` (array): e.g., Sizes ['S', 'M'].
- `yOptions` (array): e.g., Colors ['Red', 'Blue'].
- `value` (object): Record of values `{ "S-Red": { stock: 10, price: 99 } }`.
- `onChange` (function).

**Accessibility**:
- Keyboard navigable grid.
- Inputs labeled via `aria-label="Stock for Size S Color Red"`.

## 5. FileUploader
**Description**: Drag and drop zone for images and 3D models.
**Props**:
- `accept` (string): e.g., "image/*, .glb".
- `maxFiles` (number).
- `onUpload` (function).

**Accessibility**:
- Visual focus state on drag over.
- Keyboard accessible "Select File" button.

## 6. Toast
**Description**: Non-blocking notification.
**Props**:
- `type`: 'success' | 'error' | 'info'.
- `message` (string).
- `duration` (number): default 3000ms.
- `onUndo` (function): optional.

**Accessibility**:
- `role="alert"` for errors, `role="status"` for updates.
- Announce to screen readers.
