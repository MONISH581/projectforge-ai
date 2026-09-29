import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface MermaidViewerProps {
  chart: string;
  title?: string;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, title }) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    success('Diagram code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <span className="text-xs font-semibold text-slate-300 font-mono">
          {title || 'Mermaid Architecture Diagram'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Mermaid'}</span>
        </button>
      </div>

      <div className="p-4 overflow-x-auto">
        {/* Render clean preformatted code block for maximum reliability across devices */}
        <pre className="text-xs font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed select-all">
          {chart}
        </pre>
      </div>
    </div>
  );
};
