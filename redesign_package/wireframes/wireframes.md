# Admin Dashboard Wireframes

## 1. Dashboard (Home)
**Goal**: Quick overview of KPIs and urgent tasks.

### Desktop Layout
- **Header**: Global Search | User Profile | Environment Badge (Dev/Prod)
- **Sidebar**: Collapsed icon-only mode available.
- **Main Area**:
  - **Top Row**: 4 KPI Cards (Total Revenue, Orders Today, Pending Shipments, Low Stock).
    - *Interaction*: Hover scales card slightly.
  - **Middle Row**:
    - Left (2/3): "Recent Orders" DataTable. Columns: Order ID, Customer, Total, Status, Activity.
    - Right (1/3): "Fast Actions" (Create Order, Add Product) + "System Health" (Job Queue status).

### Mobile Layout
- **Header**: Hamburger Menu | Search Icon | Notification Bell
- **Main Area**:
  - Stacked KPI Cards (Swipeable carousel).
  - "Recent Orders" list becomes a card list (Order # + Status + Amount).
  - Floating Action Button (FAB) for "Create Order".

---

## 2. Orders List
**Goal**: Efficient processing and bulk management.

### Desktop Layout
- **Filters**: "Status" pills (All, Pending, Processing, Shipped) + Date Range Picker.
- **Table**:
  - Checkbox for multi-select.
  - Columns: ID, Date, Customer, Payment Status, Fulfillment Status, Total.
  - *Hover Action*: "Quick View" eye icon.
- **Bulk Action Bar** (Appears on selection):
  - "Mark as Shipped", "Print Labels", "Archive".
  - *Feedback*: Toast "3 orders updated".

### Slide-Over Detail (Drawer)
- **Trigger**: Click Order ID.
- **Content**:
  - Header: Order #1234 | Status Badge.
  - Tabs: Details, Timeline, Notes.
  - **Details**: Customer Info, Shipping Address, Line Items (Image, Name, Qty, Price).
  - **Footer**: Sticky actions "Print Invoice", "Refund", "Mark Shipped".

---

## 3. Product Manager
**Goal**: Rapid editing of catalog.

### Desktop Layout
- **View**: Grid (default for visual) or List (for bulk edit).
- **Grid Item**:
  - Thumbnail, Title, Stock Level (Color coded: Red < 10), Price.
  - Overlay actions: Edit, Duplicate, Delete.
- **Editor Modal**:
  - Left Col: Images (Drag & Drop), 3D Model Preview.
  - Right Col: Title, Desc, Matrix for Variants (Size x Color).
  - *Keyboard*: `Ctrl+S` to save.

---

## 4. Users & Settings
- **Users List**: Searchable table with Role badges.
- **Settings**:
  - Vertical tabs: General, Shipping, Expenses, Notifications.
  - "Notifications": Template editor for Emails/SMS. Text area with variable injection `{{customer_name}}`.
