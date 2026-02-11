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
