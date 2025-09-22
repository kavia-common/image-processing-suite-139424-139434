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
  editImage,
  getEditedUrl,
} from "./api";

/**
 * Image card component with quick edit tools
 */
function ImageCard({ item, onPreview, onProcess, onPoll, onDelete, onEditAction }) {
  const busy = item.status === "processing";
  return (
    <div className="card" aria-label={`image-card-${item.id}`}>
      <div className="thumb tools">
        <img src={getOriginalUrl(item.id)} alt={item.filename} />
        <div className="image-tools-bar" aria-label="image-quick-tools">
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="icon-btn"
              title="Rotate 90°"
              onClick={() => onEditAction(item, { op: "rotate", params: { angle: 90, expand: true } })}
            >⤾</button>
            <button
              className="icon-btn"
              title="Flip Vertically"
              onClick={() => onEditAction(item, { op: "flip" })}
            >⇵</button>
            <button
              className="icon-btn"
              title="Flop Horizontally"
              onClick={() => onEditAction(item, { op: "flop" })}
            >⇄</button>
            <button
              className="icon-btn"
              title="Grayscale"
              onClick={() => onEditAction(item, { op: "grayscale" })}
            >○</button>
            <button
              className="icon-btn"
              title="Blur"
              onClick={() => onEditAction(item, { op: "blur", params: { radius: 2 } })}
            >◐</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="icon-btn"
              title="Open Edited"
              onClick={() => window.open(getEditedUrl(item.id), "_blank")}
            >⬈</button>
          </div>
        </div>
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
 * Preview Drawer to compare Original vs Processed; includes Edited link
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
        <a
          className="btn"
          href={getEditedUrl(item.id)}
          target="_blank"
          rel="noreferrer"
        >
          Open Edited
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

  // Editing UI state
  const [editTarget, setEditTarget] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [cropX, setCropX] = useState("");
  const [cropY, setCropY] = useState("");
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [angle, setAngle] = useState(90);
  const [expand, setExpand] = useState(true);
  const [blurRadius, setBlurRadius] = useState(2);
  const [sharpenFactor, setSharpenFactor] = useState(1.5);
  const [autoCutoff, setAutoCutoff] = useState(0);

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

  const runEdit = async (imageId, operation, params = {}, output_format = null) => {
    setEditBusy(true);
    setEditMessage("Applying edit…");
    setError("");
    try {
      const meta = await editImage(imageId, operation, params, output_format);
      // Update list and selection
      setImages((prev) => prev.map((x) => (x.id === meta.id ? { ...x, ...meta } : x)));
      if (selected && selected.id === imageId) setSelected((prev) => ({ ...prev, ...meta }));
      if (editTarget && editTarget.id === imageId) setEditTarget((prev) => ({ ...prev, ...meta }));
      setEditMessage("Edit applied successfully.");
    } catch (e) {
      setError(e.message || "Edit error");
      setEditMessage("Edit failed.");
    } finally {
      setTimeout(() => setEditMessage(""), 1200);
      setEditBusy(false);
    }
  };

  const onEditAction = async (item, action) => {
    // Quick toolbar actions per card
    const op = action.op;
    const params = action.params || {};
    await runEdit(item.id, op, params);
  };

  const onOpenEditPanel = (item) => {
    setEditTarget(item);
    setSelected(item);
  };

  const applyResize = async () => {
    if (!editTarget) return;
    const w = resizeW ? parseInt(resizeW, 10) : undefined;
    const h = resizeH ? parseInt(resizeH, 10) : undefined;
    await runEdit(editTarget.id, "resize", { width: w, height: h, keep_aspect: keepAspect });
  };

  const applyCrop = async () => {
    if (!editTarget) return;
    const px = cropX ? parseInt(cropX, 10) : 0;
    const py = cropY ? parseInt(cropY, 10) : 0;
    const pw = cropW ? parseInt(cropW, 10) : undefined;
    const ph = cropH ? parseInt(cropH, 10) : undefined;
    await runEdit(editTarget.id, "crop", { x: px, y: py, width: pw, height: ph });
  };

  const applyRotate = async () => {
    if (!editTarget) return;
    await runEdit(editTarget.id, "rotate", { angle: Number(angle), expand });
  };

  const applyFilter = async (type) => {
    if (!editTarget) return;
    if (type === "grayscale") return runEdit(editTarget.id, "grayscale");
    if (type === "blur") return runEdit(editTarget.id, "blur", { radius: Number(blurRadius) });
    if (type === "sharpen") return runEdit(editTarget.id, "sharpen", { factor: Number(sharpenFactor) });
    if (type === "autocontrast") return runEdit(editTarget.id, "autocontrast", { cutoff: Number(autoCutoff) });
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
              <br />- Use Preview to view original vs processed and edited.
              <br />- Use quick tools on each image for rotate/flip/filters.
              <br />- Use the editor panel to resize/crop/rotate/apply filters.
              <br />- Delete to remove items.
            </div>
          </div>

          <div className="edit-panel" aria-label="edit-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Editor</h3>
              <span className="pill">{editBusy ? "Working…" : editTarget ? `Editing: ${editTarget.filename}` : "Select an image"}</span>
            </div>

            <div className="edit-group">
              <div className="edit-label">Resize</div>
              <div className="edit-row">
                <input className="edit-input" type="number" min="1" placeholder="Width" value={resizeW} onChange={(e)=>setResizeW(e.target.value)} />
                <input className="edit-input" type="number" min="1" placeholder="Height" value={resizeH} onChange={(e)=>setResizeH(e.target.value)} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                <input type="checkbox" checked={keepAspect} onChange={(e)=>setKeepAspect(e.target.checked)} /> Keep aspect ratio
              </label>
              <div className="edit-actions">
                <button className="btn" onClick={applyResize} disabled={!editTarget || editBusy}>Apply Resize</button>
              </div>
            </div>

            <div className="edit-group">
              <div className="edit-label">Crop</div>
              <div className="edit-row">
                <input className="edit-input" type="number" placeholder="X" value={cropX} onChange={(e)=>setCropX(e.target.value)} />
                <input className="edit-input" type="number" placeholder="Y" value={cropY} onChange={(e)=>setCropY(e.target.value)} />
              </div>
              <div className="edit-row">
                <input className="edit-input" type="number" min="1" placeholder="Width" value={cropW} onChange={(e)=>setCropW(e.target.value)} />
                <input className="edit-input" type="number" min="1" placeholder="Height" value={cropH} onChange={(e)=>setCropH(e.target.value)} />
              </div>
              <div className="edit-actions">
                <button className="btn" onClick={applyCrop} disabled={!editTarget || editBusy}>Apply Crop</button>
              </div>
            </div>

            <div className="edit-group">
              <div className="edit-label">Rotate</div>
              <div className="edit-row">
                <input className="edit-input" type="number" step="1" placeholder="Angle (deg)" value={angle} onChange={(e)=>setAngle(e.target.value)} />
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={expand} onChange={(e)=>setExpand(e.target.checked)} />
                  <span className="edit-label" style={{ fontWeight: 500 }}>Expand canvas</span>
                </label>
              </div>
              <div className="edit-actions">
                <button className="btn" onClick={applyRotate} disabled={!editTarget || editBusy}>Apply Rotate</button>
              </div>
            </div>

            <div className="edit-group">
              <div className="edit-label">Filters</div>
              <div className="edit-row">
                <button className="btn" onClick={() => applyFilter("grayscale")} disabled={!editTarget || editBusy}>Grayscale</button>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="edit-input" type="number" step="0.1" placeholder="Blur radius" value={blurRadius} onChange={(e)=>setBlurRadius(e.target.value)} />
                  <button className="btn" onClick={() => applyFilter("blur")} disabled={!editTarget || editBusy}>Blur</button>
                </div>
              </div>
              <div className="edit-row">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="edit-input" type="number" step="0.1" placeholder="Sharpen factor" value={sharpenFactor} onChange={(e)=>setSharpenFactor(e.target.value)} />
                  <button className="btn" onClick={() => applyFilter("sharpen")} disabled={!editTarget || editBusy}>Sharpen</button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="edit-input" type="number" step="0.1" placeholder="Autocontrast cutoff" value={autoCutoff} onChange={(e)=>setAutoCutoff(e.target.value)} />
                  <button className="btn" onClick={() => applyFilter("autocontrast")} disabled={!editTarget || editBusy}>Autocontrast</button>
                </div>
              </div>
            </div>

            {editMessage && <div className="pill" aria-live="polite">{editMessage}</div>}
            {editTarget && (
              <div className="edit-actions">
                <a className="btn" href={getOriginalUrl(editTarget.id)} target="_blank" rel="noreferrer">Open Original</a>
                <a className="btn" href={getEditedUrl(editTarget.id)} target="_blank" rel="noreferrer">Open Edited</a>
              </div>
            )}
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
                onPreview={(it) => { setSelected(it); onOpenEditPanel(it); }}
                onProcess={handleProcess}
                onPoll={handlePoll}
                onDelete={handleDelete}
                onEditAction={onEditAction}
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
        <div>Theme: Ocean Professional • Primary #2563EB • Secondary #F59E0B</div>
      </footer>

      <PreviewDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default App;
