import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, X, Eye, EyeOff } from 'lucide-react';
import { usePageEditor } from '../../../hooks/@custom/usePageEditor.js';

/**
 * PageEditor - Simple no-code page builder component
 * Allows users to create and edit pages with drag-and-drop blocks
 * Mobile-responsive with collapsible palette and preview
 */
export default function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPalette, setShowPalette] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Data fetching and save via hook (pages → hooks → api layer)
  const { page, setPage, blocks, setBlocks, loading, saving, savePage } = usePageEditor(id);

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: type === 'text' ? 'New text block' : '',
      style: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, updates) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading page editor...</p>
      </div>
    );
  }

  return (
    <div className="page-editor min-h-screen bg-background">
      {/* Mobile Header with Toggle Buttons */}
      <div className="editor-header sticky top-0 z-10 bg-background border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            {id ? 'Edit Page' : 'Create New Page'}
          </h1>
          {/* Mobile Toggle Buttons */}
          <div className="flex gap-2 lg:hidden">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="mobile-toggle"
              title="Toggle block palette"
            >
              {showPalette ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="mobile-toggle"
              title="Toggle preview"
            >
              {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="editor-actions flex gap-2 w-full sm:w-auto">
          <button onClick={() => navigate('/pages')} disabled={saving} className="action-btn secondary">
            Cancel
          </button>
          <button onClick={savePage} disabled={saving} className="action-btn primary">
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>

      {/* Page Meta Fields */}
      <div className="editor-meta px-4 py-3 border-b bg-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Page Title"
            value={page?.title || ''}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            className="meta-input flex-1"
          />
          <input
            type="text"
            placeholder="Page Slug (URL)"
            value={page?.slug || ''}
            onChange={(e) => setPage({ ...page, slug: e.target.value })}
            className="meta-input flex-1"
          />
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="editor-layout max-w-7xl mx-auto p-4">
        {/* Block Palette - Collapsible on Mobile */}
        <div className={`block-palette ${showPalette ? 'mobile-show' : ''}`}>
          <div className="palette-header flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Add Blocks</h3>
            <button
              onClick={() => setShowPalette(false)}
              className="lg:hidden p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="palette-buttons">
            <button onClick={() => { addBlock('text'); setShowPalette(false); }} className="palette-btn">
              📝 Text
            </button>
            <button onClick={() => { addBlock('heading'); setShowPalette(false); }} className="palette-btn">
              🔤 Heading
            </button>
            <button onClick={() => { addBlock('image'); setShowPalette(false); }} className="palette-btn">
              🖼️ Image
            </button>
            <button onClick={() => { addBlock('button'); setShowPalette(false); }} className="palette-btn">
              🔘 Button
            </button>
            <button onClick={() => { addBlock('divider'); setShowPalette(false); }} className="palette-btn">
              ➖ Divider
            </button>
          </div>
        </div>

        {/* Canvas - Main Editor Area */}
        <div className="canvas">
          {blocks.length === 0 ? (
            <div className="empty-state">
              <p className="text-muted-foreground">No blocks yet. Add some from the palette!</p>
              <button
                onClick={() => setShowPalette(true)}
                className="mt-4 lg:hidden palette-btn inline-flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                Open Block Palette
              </button>
            </div>
          ) : (
            blocks.map((block, index) => (
              <div key={block.id} className="block">
                <div className="block-controls">
                  <button
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={index === 0}
                    className="control-btn"
                    title="Move up"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                    className="control-btn"
                    title="Move down"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="control-btn delete"
                    title="Delete block"
                  >
                    🗑️
                  </button>
                </div>

                <div className="block-content">
                  {block.type === 'text' && (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Enter text..."
                      className="block-textarea"
                    />
                  )}
                  {block.type === 'heading' && (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Enter heading..."
                      className="block-input"
                    />
                  )}
                  {block.type === 'image' && (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Image URL..."
                      className="block-input"
                    />
                  )}
                  {block.type === 'button' && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder="Button text..."
                        className="block-input"
                      />
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Button URL..."
                        className="block-input"
                      />
                    </div>
                  )}
                  {block.type === 'divider' && <hr className="my-2 border-border" />}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview Panel - Collapsible on Mobile */}
        <div className={`preview ${showPreview ? 'mobile-show' : ''}`}>
          <div className="preview-header flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="lg:hidden p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="preview-content">
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Add blocks to see preview
              </p>
            ) : (
              blocks.map((block) => (
                <div key={block.id} className={`preview-block block-${block.type}`}>
                  {block.type === 'text' && <p className="text-sm">{block.content}</p>}
                  {block.type === 'heading' && <h2 className="text-xl font-bold">{block.content}</h2>}
                  {block.type === 'image' && block.content && (
                    <img src={block.content} alt="Preview" className="max-w-full h-auto rounded" />
                  )}
                  {block.type === 'button' && (
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
                      {block.content || 'Button'}
                    </button>
                  )}
                  {block.type === 'divider' && <hr className="my-3 border-border" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Base Styles ──────────────────────────────────────────────── */
        .page-editor {
          --color-bg: hsl(var(--background));
          --color-fg: hsl(var(--foreground));
          --color-border: hsl(var(--border));
          --color-muted: hsl(var(--muted));
          --color-muted-fg: hsl(var(--muted-foreground));
          --color-accent: hsl(var(--accent));
          --color-primary: hsl(var(--primary));
          --color-primary-fg: hsl(var(--primary-foreground));
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .editor-header {
          background: var(--color-bg);
        }

        /* ── Action Buttons ───────────────────────────────────────────── */
        .action-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          transition: all 0.2s;
          cursor: pointer;
          flex: 1;
        }

        .action-btn.primary {
          background: var(--color-primary);
          color: var(--color-primary-fg);
          border: 1px solid var(--color-primary);
        }

        .action-btn.primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .action-btn.secondary {
          background: transparent;
          color: var(--color-fg);
          border: 1px solid var(--color-border);
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: var(--color-accent);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (min-width: 640px) {
          .action-btn {
            flex: initial;
            min-width: 100px;
          }
        }

        /* ── Mobile Toggle Buttons ────────────────────────────────────── */
        .mobile-toggle {
          padding: 0.5rem;
          background: var(--color-accent);
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .mobile-toggle:hover {
          background: var(--color-muted);
        }

        /* ── Meta Inputs ──────────────────────────────────────────────── */
        .meta-input {
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          background: var(--color-bg);
          color: var(--color-fg);
          transition: border-color 0.2s;
        }

        .meta-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px hsla(var(--primary), 0.1);
        }

        /* ── Editor Layout ────────────────────────────────────────────── */
        .editor-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          position: relative;
        }

        /* Mobile: Stack vertically */
        @media (min-width: 1024px) {
          .editor-layout {
            grid-template-columns: 220px 1fr 320px;
            gap: 1.5rem;
          }
        }

        /* ── Block Palette ────────────────────────────────────────────── */
        .block-palette {
          background: var(--color-muted);
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
        }

        /* Mobile: Fixed overlay */
        @media (max-width: 1023px) {
          .block-palette {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            max-width: 80vw;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          }

          .block-palette.mobile-show {
            transform: translateX(0);
          }
        }

        .palette-header h3 {
          margin: 0;
          font-size: 0.875rem;
        }

        .palette-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .palette-btn {
          display: block;
          width: 100%;
          padding: 0.625rem 0.75rem;
          text-align: left;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .palette-btn:hover {
          background: var(--color-accent);
        }

        /* ── Canvas ───────────────────────────────────────────────────── */
        .canvas {
          min-height: 400px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .canvas {
            padding: 1.5rem;
          }
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        /* ── Block Styles ─────────────────────────────────────────────── */
        .block {
          margin-bottom: 1rem;
          padding: 1rem;
          padding-top: 2.5rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          position: relative;
          background: var(--color-bg);
        }

        .block-controls {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.375rem;
          z-index: 10;
        }

        .control-btn {
          padding: 0.375rem 0.625rem;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          min-width: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover:not(:disabled) {
          background: var(--color-accent);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .control-btn.delete:hover:not(:disabled) {
          background: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
          border-color: hsl(var(--destructive));
        }

        /* Touch-friendly on mobile */
        @media (max-width: 767px) {
          .control-btn {
            padding: 0.5rem 0.75rem;
            min-width: 2.5rem;
          }
        }

        .block-content {
          margin-top: 0.5rem;
        }

        .block-textarea,
        .block-input {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          background: var(--color-bg);
          color: var(--color-fg);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .block-textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        .block-textarea:focus,
        .block-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px hsla(var(--primary), 0.1);
        }

        /* ── Preview Panel ────────────────────────────────────────────── */
        .preview {
          background: var(--color-muted);
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
        }

        /* Mobile: Fixed overlay from right */
        @media (max-width: 1023px) {
          .preview {
            position: fixed;
            top: 0;
            right: 0;
            width: 320px;
            max-width: 85vw;
            height: 100vh;
            z-index: 50;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
          }

          .preview.mobile-show {
            transform: translateX(0);
          }
        }

        .preview-header h3 {
          margin: 0;
          font-size: 0.875rem;
        }

        .preview-content {
          background: var(--color-bg);
          padding: 1rem;
          border-radius: 0.375rem;
          margin-top: 0.75rem;
        }

        .preview-block {
          margin-bottom: 1rem;
        }

        .preview-block:last-child {
          margin-bottom: 0;
        }

        /* ── Mobile Overlay Backdrop ──────────────────────────────────── */
        @media (max-width: 1023px) {
          .block-palette.mobile-show::before,
          .preview.mobile-show::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
          }
        }

        /* ── Responsive Typography ────────────────────────────────────── */
        @media (max-width: 640px) {
          .editor-header h1 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}
