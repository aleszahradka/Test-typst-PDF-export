'use client';

import { useState, useTransition } from 'react';
import { DEFAULT_TYPST_TEMPLATE } from '@/lib/default-template';
import { formatTextToTypst } from '@/lib/typst-utils';

export default function HomePage() {
  const [code, setCode] = useState<string>(DEFAULT_TYPST_TEMPLATE);
  const [status, setStatus] = useState<'idle' | 'compiling-wasm' | 'compiling-cli'>('idle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to trigger browser file download
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Button 1: Download raw .typ file
  const handleDownloadTyp = () => {
    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      downloadFile(blob, 'document.typ');
      setSuccessMessage('Successfully downloaded document.typ source file!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const error = err as Error;
      setErrorDetails({
        title: 'Download Error',
        message: error.message || 'Failed to download document.typ file.',
      });
    }
  };

  // Button 2: Export PDF via WebAssembly (Client-side)
  const handleExportWasm = async () => {
    setStatus('compiling-wasm');
    setSuccessMessage(null);
    setErrorDetails(null);

    try {
      const { $typst } = await import('@myriaddreamin/typst.ts');
      const pdfData = await $typst.pdf({ mainContent: code });

      if (!pdfData) {
        throw new Error('WebAssembly compiler returned empty PDF data.');
      }

      // Convert Uint8Array to Blob and download
      const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
      downloadFile(blob, 'document-wasm.pdf');
      setSuccessMessage('Successfully compiled and downloaded PDF via WebAssembly!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const error = err as Error;
      setErrorDetails({
        title: 'WebAssembly Compilation Error',
        message: error.message || 'Failed to compile PDF in browser via WebAssembly.',
      });
    } finally {
      setStatus('idle');
    }
  };

  // Button 3: Export PDF via CLI Engine (Serverless API)
  const handleExportCli = async () => {
    setStatus('compiling-cli');
    setSuccessMessage(null);
    setErrorDetails(null);

    try {
      const response = await fetch('/api/compile-cli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'HTTP Error',
          details: `Server returned status ${response.status}`,
        }));
        throw new Error(errorData.details || errorData.error || 'CLI compilation failed.');
      }

      const pdfBlob = await response.blob();
      downloadFile(pdfBlob, 'document-cli.pdf');
      setSuccessMessage('Successfully compiled and downloaded PDF via Typst CLI Engine!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const error = err as Error;
      setErrorDetails({
        title: 'Typst CLI Engine Compilation Error',
        message: error.message || 'An error occurred during server-side compilation.',
      });
    } finally {
      setStatus('idle');
    }
  };

  // Formatting Helper: Convert plain text to Typst markup
  const handleFormatToTypst = () => {
    startTransition(() => {
      const formatted = formatTextToTypst(code);
      setCode(formatted);
      setSuccessMessage('Converted plain text special characters into valid Typst markup!');
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  // Reset to default template
  const handleResetTemplate = () => {
    if (confirm('Reset editor to default starter template?')) {
      setCode(DEFAULT_TYPST_TEMPLATE);
      setSuccessMessage('Reset editor to starter template.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const lineCount = code.split('\n').length;
  const wordCount = code.trim() ? code.trim().split(/\s+/).length : 0;
  const charCount = code.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                Typst Document Generator
              </h1>
              <p className="text-xs text-slate-400">Dual-Engine PDF Exporter (WebAssembly & Typst CLI)</p>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormatToTypst}
              disabled={isPending || status !== 'idle'}
              className="inline-flex items-center px-3 py-1.5 border border-amber-500/30 text-xs font-medium rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              title="Escapes special characters in plain text to generate valid Typst markup"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Convert Text to Typst
            </button>

            <button
              onClick={handleResetTemplate}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-3 py-1.5 border border-slate-700 text-xs font-medium rounded-lg text-slate-300 bg-slate-800/60 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Template
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-4">
        {/* Export Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Export Options</h2>
            <p className="text-xs text-slate-400">Choose between raw source export, instant browser WASM, or CLI serverless rendering.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Button 1: Download .typ */}
            <button
              onClick={handleDownloadTyp}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl border border-slate-700 shadow-sm transition-all hover:border-slate-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download .typ
            </button>

            {/* Button 2: Export PDF (WebAssembly) */}
            <button
              onClick={handleExportWasm}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {status === 'compiling-wasm' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling WASM...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Export PDF (WebAssembly)
                </>
              )}
            </button>

            {/* Button 3: Export PDF (CLI Engine) */}
            <button
              onClick={handleExportCli}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {status === 'compiling-cli' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling CLI...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Export PDF (CLI Engine)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-300 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Code / Text Editor Container */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[520px]">
          {/* Editor Header Bar */}
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 text-xs font-mono text-slate-400">document.typ</span>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
              <span>{lineCount} lines</span>
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
            </div>
          </div>

          {/* Text Area Editor */}
          <div className="relative flex-1 flex">
            {/* Line Numbers Column */}
            <div className="bg-slate-950/40 text-slate-600 font-mono text-sm py-4 px-3 select-none text-right border-r border-slate-800/60 hidden sm:block min-w-[3.5rem]">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your text or Typst code here..."
              spellCheck={false}
              className="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-sm leading-relaxed border-0 focus:outline-none focus:ring-0 resize-none selection:bg-indigo-600 selection:text-white"
            />
          </div>
        </div>
      </main>

      {/* Error Modal Popup for Compilation Errors */}
      {errorDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{errorDetails.title}</h3>
                  <p className="text-xs text-rose-400">Typst compilation failed. Review syntax errors below:</p>
                </div>
              </div>

              <button
                onClick={() => setErrorDetails(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message Details */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-80">
              <pre className="text-xs font-mono text-rose-300 whitespace-pre-wrap leading-relaxed">
                {errorDetails.message}
              </pre>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorDetails.message);
                  alert('Error details copied to clipboard.');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Copy Error
              </button>
              <button
                onClick={() => setErrorDetails(null)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg shadow-md transition-colors"
              >
                Close & Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Typst Document Generator & Dual-Engine PDF Exporter — Vercel & WebAssembly Ready
      </footer>
    </div>
  );
}
