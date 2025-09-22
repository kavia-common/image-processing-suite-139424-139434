import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  listImages,
  uploadImage,
  triggerProcess,
  getStatus,
  getOriginalUrl,
  getProcessedUrl,
  deleteImage,
} from "./api";

/**
 * Image card component
 */
function ImageCard({ item, onPreview, onProcess, onPoll, onDelete }) {
  const busy = item.status === "processing";
  return (
    <div className="card" aria-label={`image-card-${item.id}`}>
      <div className="thumb">
        <img src={getOriginalUrl(item.id)} alt={item.filename} />
      </div>
      <div className="meta">
        <div className="title" title={item.filename}>{item.filename}</div>
        <div className="status">
          <span className="status-pill">
            <span
              style={{
                width: 8,
                height: 8,
                background:
                  item.status === "completed"
                    ? "#10B981"
                    : item.status === "processing"
                    ? "#F59E0B"
                    : item.status === "failed"
                    ? "#EF4444"
                    : "#9CA3AF",
                display: "inline-block",
                borderRadius: "999px",
              }}
            />
            {item.status}
          </span>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => onPreview(item)}>
            Preview
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onProcess(item)}
            disabled={busy}
            title={busy ? "Already processing" : "Trigger processing"}
          >
            {busy ? "Processing…" : "Process"}
          </button>
          <button className="btn" onClick={() => onPoll(item)}>
            Check Status
          </button>
          <button
            className="btn"
            onClick={() => onDelete(item)}
            title="Delete image"
            style={{ background: "#fee2e2", color: "#7f1d1d" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Upload widget component
 */
function Uploader({ onFilesSelected, busy }) {
  const inputRef = useRef(null);
  const onPick = () => inputRef.current?.click();

  const handleFiles = (files) => {
    const arr = Array.from(files || []);
    const imageFiles = arr.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length) onFilesSelected(imageFiles);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="panel">
      <h3>Upload Images</h3>
      <div
        className="upload-drop"
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        aria-disabled={busy}
        aria-label="Upload images"
        onClick={onPick}
      >
        <strong>{busy ? "Uploading…" : "Click to select or drop files here"}</strong>
        <div className="hint">PNG, JPG, GIF up to a few MB</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy}
        />
      </div>
    </div>
  );
}

/**
 * Preview Drawer to compare Original vs Processed
 */
function PreviewDrawer({ item, onClose }) {
  if (!item) return null;
  return (
    <aside className="preview" aria-label="preview-drawer">
      <div className="preview-header">
        <div style={{ fontWeight: 700 }}>{item.filename}</div>
        <div className="actions">
          <div className="status-pill">{item.status}</div>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="preview-body">
        <div className="preview-col">
          <h4>Original</h4>
          <div className="preview-image">
            <img src={getOriginalUrl(item.id)} alt={`${item.filename} original`} />
          </div>
        </div>
        <div className="preview-col">
          <h4>Processed</h4>
          <div className="preview-image">
            {item.status === "completed" ? (
              <img
                src={getProcessedUrl(item.id)}
                alt={`${item.filename} processed`}
              />
            ) : (
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                Processed image will appear here after completion.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="preview-footer">
        <a
          className="btn"
          href={getOriginalUrl(item.id)}
          target="_blank"
          rel="noreferrer"
        >
          Open Original
        </a>
        {item.status === "completed" && (
          <a
            className="btn btn-primary"
            href={getProcessedUrl(item.id)}
            target="_blank"
            rel="noreferrer"
          >
            Open Processed
          </a>
        )}
      </div>
    </aside>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main application component with Ocean Professional theme and full functionality. */
  const [images, setImages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter(
      (it) =>
        it.filename.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q) ||
        it.status.toLowerCase().includes(q)
    );
  }, [images, query]);

  const fetchImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listImages(page, pageSize);
      setImages(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message || "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleUpload = async (files) => {
    setUploading(true);
    setError("");
    try {
      for (const f of files) {
        await uploadImage(f);
      }
      await fetchImages();
    } catch (e) {
      setError(e.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (item) => {
    setError("");
    try {
      await triggerProcess(item.id, "grayscale", {});
      await fetchImages();
    } catch (e) {
      setError(e.message || "Process trigger error");
    }
  };

  const handlePoll = async (item) => {
    setError("");
    try {
      const meta = await getStatus(item.id);
      // Update in-place if exists
      setImages((prev) =>
        prev.map((x) => (x.id === meta.id ? { ...x, ...meta } : x))
      );
      if (selected && selected.id === item.id) {
        setSelected((prev) => ({ ...prev, ...meta }));
      }
    } catch (e) {
      setError(e.message || "Status check error");
    }
  };

  const handleDelete = async (item) => {
    setError("");
    try {
      await deleteImage(item.id);
      setSelected((s) => (s && s.id === item.id ? null : s));
      await fetchImages();
    } catch (e) {
      setError(e.message || "Delete error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">IP</span>
          <div>
            Image Processing Suite
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Ocean Professional
            </div>
          </div>
        </div>
        <div className="top-actions">
          <span className="badge">Connected to API</span>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <Uploader onFilesSelected={handleUpload} busy={uploading} />
          <div className="panel">
            <h3>Info</h3>
            <div style={{ fontSize: 13, color: "#374151" }}>
              - Upload one or more images.
              <br />- Click Process to run grayscale (demo).
              <br />- Use Preview to view original vs processed.
              <br />- Use Check Status to refresh processing state.
              <br />- Delete to remove items.
            </div>
          </div>
          {error && (
            <div
              className="panel"
              style={{
                borderColor: "#fecaca",
                background: "#fef2f2",
                color: "#991b1b",
              }}
            >
              <h3 style={{ color: "#991b1b" }}>Error</h3>
              <div style={{ fontSize: 13 }}>{error}</div>
            </div>
          )}
        </aside>

        <section className="content">
          <div className="toolbar">
            <div className="search">
              <input
                placeholder="Search by filename, id or status…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="search"
              />
            </div>
            <div className="actions">
              <button className="btn" onClick={fetchImages} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </button>
              <div className="status-pill">
                Total: {total} • Page {page} / {totalPages}
              </div>
            </div>
          </div>

          <div className="gallery" aria-live="polite">
            {filtered.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onPreview={setSelected}
                onProcess={handleProcess}
                onPoll={handlePoll}
                onDelete={handleDelete}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <div style={{ color: "#6b7280", padding: 20 }}>
                No images to display.
              </div>
            )}
          </div>

          <div className="toolbar">
            <div className="actions">
              <button
                className="btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </button>
            </div>
            <div className="status-pill">Showing {filtered.length} items</div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>© {new Date().getFullYear()} Image Processing Suite</div>
        <div>Theme: Ocean Professional • Primary #{/* */}2563EB • Secondary #F59E0B</div>
      </footer>

      <PreviewDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default App;
