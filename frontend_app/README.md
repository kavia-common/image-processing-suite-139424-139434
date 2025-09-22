# Image Processing Suite Frontend (React)

Ocean Professional themed React app to upload images, trigger processing, poll status, preview original/processed, list and delete images.

## Quick Start

- Install: `npm install`
- Run: `npm start`

By default, the app calls the backend using a relative path (same origin). To target another host/port:

- Create a `.env` file in this folder with:
  ```
  REACT_APP_API_BASE=http://localhost:3001
  ```

Then restart the dev server.

## Features
- Upload images (POST /api/images)
- List images (GET /api/images)
- Trigger processing (POST /api/images/{image_id}/process)
- Check status (GET /api/images/{image_id}/status)
- Preview original (GET /api/images/{image_id}/original) and processed (GET /api/images/{image_id}/processed)
- Delete image (DELETE /api/images/{image_id})

## Theme
Implements "Ocean Professional":
- Primary: #2563EB
- Secondary: #F59E0B
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827

Responsive layout with top bar, sidebar, content gallery, and footer.
