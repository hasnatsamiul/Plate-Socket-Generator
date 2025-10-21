# Plate & Socket Generator

An interactive builder that lets you design back panels (“plates”) and place socket groups on them with realistic, centimeter-based proportions. The canvas (left) renders plates to scale and supports dragging with live guides, while the controls (right) let you change sizes, add/delete plates, and fully configure socket groups. The UI is responsive (mobile/tablet friendly) and touch-enabled. This project is developed as part of the Rueckwand24 Frontend Technical Assessment.

## Live Demo (Link)

https://plate-socket-generator.vercel.app/

_(Deployed on Vercel)_

## Demo Video



https://github.com/user-attachments/assets/92ef07d2-a2d9-4c68-888b-8392adbf9813

## Demo Mobile View

https://github.com/user-attachments/assets/b57b4472-0069-4b53-90bf-67f175faf7ca






## Features

- **Plate Management**
  - Create, resize, and delete plates dynamically.
  - Plates automatically scale to fit the canvas while maintaining correct proportions.
  - Resizing a plate removes only its associated socket groups (others remain intact).

- **Socket Management**
  - Toggle socket configuration ON/OFF at any time.
  - When OFF -- all socket groups removed.
  - When ON -- automatically adds one default socket group on the first eligible plate (>= 40 × 40 cm)
  - Each socket group includes: Plate selector (switch the attached plate if valid).
  - Number selector (1–5 sockets) per group.
  - Orientation selector (Horizontal / Vertical).
  - Position inputs (Distance from left + bottom, in cm).
  - All dimensions represented in centimeters (cm) for accuracy.
  - Sockets are 7 × 7 cm, with 0.2 cm spacing between them.
  - Socket groups automatically compute their total extent (based on count + orientation).
  - 3 cm >= distance from plate edges. 4 cm >= distance between groups.

- **Interactive Drag-and-Drop**
  - Drag sockets visually to adjust their position on the plate.
  - Two live guidelines show the current distance from the left and bottom edges.
  - Distances update dynamically in cm while dragging.
  - Invalid drags (violating spacing or bounds) are blocked, showing red highlight on the group.
  - On release, groups snap to the last valid position.
  - Supports mouse and touch input seamlessly.

- **Validation & Feedback**
  - Real-time validation of all user actions.
  - If plate dimensions invalid then input field highlights red.
  - If dragging outside valid area then red outline + tooltip reason.
  - If attempting to add sockets to undersized plates then blocked with overlay “Zu klein – min 40 × 40 cm”.
  - Clear visual feedback for every blocked or invalid operation.
 
- **Summary & Ready View**
  - “Ready” button generates a compact summary of all plates and socket counts.

## Tech Stack
  - React +TypeScript
  - Vite
  - Pure CSS
  - Custom React Hooks
  - Vercel (deployment)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/hasnatsamiul/Plate-Socket-Generator.git
cd plate-socket-generator

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
#  open http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```
 

