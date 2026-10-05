import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Eye, Code, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  chart: string;
  title?: string;
}

// Initialize mermaid once with a sleek dark theme
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      darkMode: true,
      background: '#090d16',
      primaryColor: '#4f46e5',
      primaryTextColor: '#f8fafc',
      primaryBorderColor: '#6366f1',
      lineColor: '#64748b',
      secondaryColor: '#0ea5e9',
      tertiaryColor: '#1e293b',
      noteBkgColor: '#1e293b',
      noteTextColor: '#cbd5e1'
    }
  });
} catch (e) {
  console.warn('Mermaid initialization note:', e);
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, title }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart || !chart.trim()) {
        setSvgHtml('');
        return;
      }

      setRenderError(null);
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        // Normalize any irregular indentation or carriage returns
        const cleanChart = chart.replace(/\r\n/g, '\n').trim();
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Mermaid rendering notice:', err?.message || err);
          setRenderError('Visual diagram generated in code structure mode.');
          setSvgHtml('');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    success('Diagram code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 font-mono">
            {title || 'Architecture Blueprint'}
          </span>
          {renderError && (
            <span className="text-[10px] text-amber-400/90 font-sans px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Code View Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls for diagram view */}
          {viewMode === 'diagram' && svgHtml && (
            <div className="flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 text-slate-400 hover:text-white"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Diagram / Code Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                viewMode === 'diagram'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                viewMode === 'code'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Mermaid</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} className="p-4 overflow-x-auto min-h-[220px] flex items-center justify-center bg-slate-950/40">
        {viewMode === 'diagram' && svgHtml ? (
          <div
            className="transition-transform duration-200 origin-center max-w-full"
            style={{ transform: `scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <pre className="w-full text-xs font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed select-all bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 overflow-x-auto">
            {chart}
          </pre>
        )}
      </div>
    </div>
  );
};

