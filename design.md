# Urea Delivery Tracker - Design Plan

## App Overview
Mobile app for truck-to-truck urea delivery business to manage clients, track deliveries with start/end times, record liters delivered, and generate printable reports.

## Target Platform
- **Primary**: iOS (portrait orientation, 9:16)
- **One-handed usage**: All primary actions accessible with thumb
- **Design standard**: Apple Human Interface Guidelines (HIG) - native iOS feel

## Color Scheme
- **Primary**: Deep blue (#0066CC) - represents trust and professionalism in industrial/logistics
- **Background**: White (#FFFFFF) light mode, Dark gray (#151718) dark mode
- **Surface**: Light gray (#F5F5F5) light mode, Darker gray (#1E2022) dark mode
- **Accent/Success**: Green (#22C55E) - for completed deliveries
- **Text**: Dark gray (#11181C) light mode, Light gray (#ECEDEE) dark mode

## Screen List

### 1. Home Screen (Clients List)
**Primary Content:**
- List of all clients (name, company, phone)
- Search bar at top
- Add client button (floating action button, bottom right)

**Functionality:**
- Search/filter clients
- Tap client to start new delivery
- Swipe actions: Edit client, Delete client
- Pull to refresh

### 2. Add/Edit Client Screen
**Primary Content:**
- Form with fields:
  - Client name (required)
  - Company name
  - Phone number
  - Address
  - Notes

**Functionality:**
- Save button (top right)
- Cancel button (top left)
- Form validation

### 3. Active Delivery Screen
**Primary Content:**
- Client info card (name, company)
- Large timer display showing elapsed time
- Start time display
- Liters delivered input (large numeric input)
- Stop delivery button (prominent, red)

**Functionality:**
- Timer starts automatically when screen opens
- Manual input for liters delivered
- Stop button ends delivery and navigates to summary

### 4. Delivery Summary Screen
**Primary Content:**
- Client info
- Start time
- End time
- Duration
- Total liters delivered
- Date
- Share/Print button
- Save & New Delivery button
- Back to Home button

**Functionality:**
- Generate PDF/printable report
- Share via email/messaging
- Save delivery record
- Start new delivery for same client

### 5. Delivery History Screen (Tab)
**Primary Content:**
- List of past deliveries (grouped by date)
- Each item shows: client name, date, duration, liters
- Filter by date range
- Filter by client

**Functionality:**
- Tap to view full delivery details
- Export selected deliveries
- Delete delivery records

## Key User Flows

### Flow 1: New Delivery
1. User opens app → Home screen (clients list)
2. User taps client → Active Delivery screen opens, timer starts
3. User enters liters delivered during/after delivery
4. User taps "Stop Delivery" → Delivery Summary screen
5. User reviews info, taps "Share/Print" → Share sheet opens
6. User saves and returns to home or starts new delivery

### Flow 2: Add New Client
1. User taps "+" button on Home screen
2. Add Client screen opens
3. User fills in client details
4. User taps "Save" → Returns to Home screen with new client

### Flow 3: View Delivery History
1. User taps "History" tab
2. Delivery History screen shows all past deliveries
3. User taps a delivery → Delivery Detail screen
4. User can share/print from detail screen

## Navigation Structure
- **Tab Bar** (bottom):
  - Clients (home icon)
  - History (clock icon)

## Design Principles
- **Large touch targets**: Minimum 44x44pt for all interactive elements
- **Clear hierarchy**: Most important info (client name, timer, liters) is largest
- **Minimal input**: Auto-start timer, pre-fill client info
- **Quick actions**: Swipe gestures for edit/delete
- **Immediate feedback**: Haptic feedback on button presses
- **Offline-first**: All data stored locally (AsyncStorage)
- **No authentication**: Simple, single-user app

## Typography
- **Headers**: SF Pro Display, Bold, 28-34pt
- **Body**: SF Pro Text, Regular, 16-17pt
- **Captions**: SF Pro Text, Regular, 13-14pt
- **Numbers**: SF Pro Display, Semibold, 48pt (timer), 32pt (liters)

## Components
- Native iOS-style list items
- Rounded cards for info display
- Large, rounded buttons for primary actions
- Native iOS form inputs
- Native share sheet for export
