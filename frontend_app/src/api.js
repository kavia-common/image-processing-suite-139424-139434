 // PUBLIC_INTERFACE
 /**
  * API client for the Image Processing Suite backend.
  * Uses REST endpoints to upload, process, check status, fetch images, and delete.
  * The base URL can be configured via the REACT_APP_API_BASE environment variable.
  */
 const API_BASE =
   process.env.REACT_APP_API_BASE ||
   ""; // If empty, will use same host; otherwise set e.g. http://localhost:3001

 // Helper to build full URL for backend endpoints
 const url = (path) => {
   // Ensure no double slashes
   const base = API_BASE.replace(/\/+$/, "");
   const suffix = path.startsWith("/") ? path : `/${path}`;
   return `${base}${suffix}`;
 };

 // PUBLIC_INTERFACE
 export async function listImages(page = 1, pageSize = 20) {
   /** List images with pagination. Returns { items, total, page, page_size } */
   const res = await fetch(url(`/api/images?page=${page}&page_size=${pageSize}`));
   if (!res.ok) {
     throw new Error(`Failed to list images (${res.status})`);
   }
   return res.json();
 }

 // PUBLIC_INTERFACE
 export async function uploadImage(file) {
   /** Upload a single image file. Returns ImageMeta. */
   const form = new FormData();
   form.append("file", file);
   const res = await fetch(url("/api/images"), {
     method: "POST",
     body: form,
   });
   if (res.status === 201 || res.ok) {
     return res.json();
   }
   const text = await res.text();
   throw new Error(`Upload failed (${res.status}): ${text}`);
 }

 // PUBLIC_INTERFACE
 export async function triggerProcess(imageId, operation = "grayscale", params = {}) {
   /** Trigger processing for an image with given operation. Returns ImageMeta. */
   const res = await fetch(url(`/api/images/${imageId}/process`), {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ operation, params }),
   });
   if (res.status === 202 || res.ok) {
     return res.json();
   }
   const text = await res.text();
   throw new Error(`Process trigger failed (${res.status}): ${text}`);
 }

 // PUBLIC_INTERFACE
 export async function getStatus(imageId) {
   /** Get current processing status. Returns ImageMeta. */
   const res = await fetch(url(`/api/images/${imageId}/status`));
   if (!res.ok) {
     throw new Error(`Status fetch failed (${res.status})`);
   }
   return res.json();
 }

 // PUBLIC_INTERFACE
 export function getOriginalUrl(imageId) {
   /** Get URL for the original image content (for <img src=...>). */
   return url(`/api/images/${imageId}/original`);
 }

 // PUBLIC_INTERFACE
 export function getProcessedUrl(imageId) {
   /** Get URL for the processed image content (for <img src=...>). */
   return url(`/api/images/${imageId}/processed`);
 }

 // PUBLIC_INTERFACE
 export async function deleteImage(imageId) {
   /** Delete an image and its content. */
   const res = await fetch(url(`/api/images/${imageId}`), { method: "DELETE" });
   if (res.status === 204) return true;
   const text = await res.text();
   throw new Error(`Delete failed (${res.status}): ${text}`);
 }

 // PUBLIC_INTERFACE
 export async function editImage(imageId, operation, params = {}, output_format = null) {
   /** Apply an edit operation synchronously and return updated ImageMeta. */
   const body = { operation, params };
   if (output_format) body.output_format = output_format;
   const res = await fetch(url(`/api/images/${imageId}/edit`), {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(body),
   });
   if (!res.ok) {
     const text = await res.text();
     throw new Error(`Edit failed (${res.status}): ${text}`);
   }
   return res.json();
 }

 // PUBLIC_INTERFACE
 export function getEditedUrl(imageId) {
   /** Get URL for the last edited image content (for <img src=...>). */
   return url(`/api/images/${imageId}/edited`);
 }
