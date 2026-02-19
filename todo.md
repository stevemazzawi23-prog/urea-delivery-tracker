# Project TODO

## Branding
- [x] Generate custom app logo
- [x] Update app.config.ts with app name and logo

## Client Management
- [x] Create client data model and AsyncStorage functions
- [x] Build Clients List screen (Home)
- [x] Add search/filter functionality
- [x] Implement Add Client screen
- [x] Implement Edit Client screen
- [x] Add swipe-to-delete functionality

## Delivery Tracking
- [x] Create delivery data model and AsyncStorage functions
- [x] Build Active Delivery screen with timer
- [x] Implement liters input field
- [x] Add stop delivery functionality
- [x] Build Delivery Summary screen

## Delivery History
- [x] Create History tab in navigation
- [x] Build Delivery History list screen
- [x] Implement date filtering
- [x] Implement client filtering
- [x] Build Delivery Detail screen

## Export/Print
- [x] Implement PDF generation for delivery reports
- [x] Add share functionality (native share sheet)
- [x] Format delivery report with all details

## UI/UX Polish
- [x] Add haptic feedback to buttons
- [x] Implement pull-to-refresh on lists
- [x] Add loading states
- [x] Add empty states for lists
- [x] Test all user flows end-to-end


## Sites Management (New)
- [x] Create site data model and AsyncStorage functions
- [x] Add sites list to client detail screen
- [x] Implement Add Site screen
- [x] Implement Edit Site screen
- [x] Add delete site functionality

## Delivery Tracking Enhancement
- [x] Update Active Delivery screen to show selected site
- [x] Update Delivery Summary to include site information
- [x] Update Delivery History to display site details
- [x] Update storage to track site_id with deliveries


## Photo Capture Feature (New)
- [x] Update Delivery model to include photos array
- [x] Create photo capture screen with camera integration
- [x] Add photo gallery to Active Delivery screen
- [x] Display photos in Delivery Summary
- [x] Display photos in Delivery Detail/History
- [x] Include photos in printable reports
- [x] Add photo deletion functionality


## Post-Delivery Photo Capture (New)
- [x] Add photo capture button to Delivery Summary screen
- [x] Allow editing photos after delivery is completed
- [x] Update delivery record with new photos
- [x] Display updated photos in history


## Bug Fixes
- [x] Fix photo display issue in capture-photo screen (images not loading)
- [x] Fix camera black screen issue in capture-photo


## Android Build & Deployment
- [x] Configure Android permissions and camera plugin
- [ ] Build APK for Android testing
- [ ] Test app on Android device
- [x] Fix pnpm installation error in Android build (switched to npm)


## Email & Proof of Delivery (POD)
- [x] Add email field to clients (database schema)
- [x] Create tRPC API for client, site, and delivery management
- [x] Implement email validation in API
- [x] Add POD email sending functionality (backend)
- [x] Create email input screen for client management (frontend)
- [x] Add email sending button to delivery summary (frontend)
- [ ] Configure SMTP or SendGrid integration (optional)


## Website Integration
- [x] Create About/Website tab in navigation
- [x] Integrate SP Logistix website component into mobile app
- [x] Add contact form integration


## Splash Screen & Branding
- [x] Add SP Logistix logo to splash screen
- [x] Update app icon with SP Logistix logo
- [x] Configure splash screen appearance
- [x] Fix splash screen logo not displaying (converted AVIF to PNG)


## Multiple Units Per Delivery (New)
- [x] Add units management to delivery data model
- [x] Create units input interface during active delivery
- [x] Display units summary before sending report
- [x] Calculate total liters from all units
- [x] Include units breakdown in delivery report
- [x] Display units details in delivery history


## Email Display in Client Cards
- [x] Add email field to client list cards
- [x] Display email icon with client contact info
- [x] Add email editing capability in client detail screen


## Invoicing System
- [x] Add invoice data model with pricing calculation
- [x] Create invoice screen with pricing details
- [x] Calculate taxes (GST/QST for Quebec)
- [x] Generate invoice PDF
- [x] Add email sending functionality for invoices
- [x] Display invoice history
- [x] Add invoice button to delivery summary


## PDF Invoice Export
- [x] Copy logo to project assets
- [x] Create PDF generation utility with logo
- [x] Add download PDF button to invoice screen
- [x] Test PDF generation and download


## Email PDF Attachment
- [x] Create email utility with PDF attachment support
- [x] Update invoice send function to attach PDF
- [x] Test email sending with PDF on mobile and web


## Home Page Dashboard
- [x] Create professional home page with logo
- [x] Add "Start Delivery" button
- [x] Add "View Invoices" button
- [x] Add "Client Database" button
- [x] Display quick stats (deliveries today, total liters)
- [x] Fix home page not displaying at app startup


## Driver Management & Shift Tracking
- [x] Create driver data model and storage functions
- [x] Add driver selection screen
- [x] Add driver selection button to home page
- [x] Create shift start/end functionality
- [x] Add work time counter to home page
- [x] Auto-reset counter when shift ends
- [x] Display current driver name on home page
- [x] Fix shift end button not stopping the timer correctly
- [x] Fix shift timer not stopping when shift ends
- [x] Reset all stats (time, liters, deliveries) to zero when shift ends

## Equipment Management
- [x] Create equipment data model and storage functions
- [x] Add equipment management screen
- [x] Assign equipment to clients
- [x] Display equipment list in client detail screen
- [x] Fix equipment saving to AsyncStorage
- [x] Add capacity validation alert during delivery - warn user if liters exceed equipment capacity

## Navigation Bar
- [x] Add navigation bar to all pages in the app
- [x] Create shared layout with tab navigation for all detail pages
- [x] Hide detail pages from tab bar while keeping them accessible
- [x] Test navigation bar visibility across all pages

## Invoice Formatting
- [x] Remove French accents from invoice PDF text for proper display

## Delivery Ticket Formatting
- [x] Apply accent removal to delivery ticket PDF text for consistency

## Email Features
- [x] Send invoice PDF as attachment when sending invoice by email

## Invoice PDF Improvements
- [x] Fix invoice PDF attachment not being sent with email
- [x] Redesign invoice PDF with professional layout and styling
- [x] Add company logo and header to invoice
- [x] Improve invoice formatting with better spacing and typography


## Bug Fixes
- [x] Fix black screen issue - app not displaying anything


## Invoice Customization - SP Logistix
- [x] Add company information: SP Logistix, bureau de mtl
- [x] Add email: Logistixsp@gmail.com
- [x] Update payment terms to "sous les 15 jours"
- [x] Remove invoice status from invoice
- [x] Remove word "professionnelle" from description
- [x] Update description to show "livraison d'urée - site - date de livraison"

## UI Improvements
- [x] Remove timer/chrono from homepage
