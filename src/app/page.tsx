'use client';

import { useState, useTransition } from 'react';
import { formatTextToTypst } from '@/lib/typst-utils';

export default function HomePage() {
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'compiling-cli'>('idle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pomocná funkce pro spuštění stažení souboru v prohlížeči
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

  // Stažení zdrojového souboru .typ
  const handleDownloadTyp = () => {
    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      downloadFile(blob, 'document.typ');
      setSuccessMessage('Zdrojový soubor document.typ byl úspěšně stažen!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const error = err as Error;
      setErrorDetails({
        title: 'Chyba při stahování',
        message: error.message || 'Nepodařilo se stáhnout soubor document.typ.',
      });
    }
  };

  // Export PDF pomocí CLI nástroje (Serverless API)
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
          error: 'Chyba HTTP',
          details: `Server vrátil stav ${response.status}`,
        }));
        throw new Error(errorData.details || errorData.error || 'Kompilace pomocí CLI selhala.');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      setSuccessMessage('PDF bylo úspěšně zkompilováno a otevřeno v novém okně!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const error = err as Error;
      setErrorDetails({
        title: 'Chyba kompilace Typst CLI',
        message: error.message || 'Při kompilaci na serveru došlo k chybě.',
      });
    } finally {
      setStatus('idle');
    }
  };

  // Převod obyčejného textu na značkování Typst
  const handleFormatToTypst = () => {
    startTransition(() => {
      const formatted = formatTextToTypst(code);
      setCode(formatted);
      setSuccessMessage('Speciální znaky v prostém textu byly převedeny na platnou značku Typst!');
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  // Vyčištění editoru
  const handleClearEditor = () => {
    if (confirm('Opravdu chcete vyčistit editor?')) {
      setCode('');
      setSuccessMessage('Editor byl vyčištěn.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const lineCount = code.split('\n').length;
  const wordCount = code.trim() ? code.trim().split(/\s+/).length : 0;
  const charCount = code.length;

  const formatCount = (count: number, singular: string, few: string, many: string) => {
    if (count === 1) return `${count} ${singular}`;
    if (count >= 2 && count <= 4) return `${count} ${few}`;
    return `${count} ${many}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Hlavička / Navbar */}
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
                Generátor dokumentů Typst
              </h1>
              <p className="text-xs text-slate-400">Export do PDF pomocí nástroje Typst CLI</p>
            </div>
          </div>

          {/* Vedlejší akce */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormatToTypst}
              disabled={isPending || status !== 'idle'}
              className="inline-flex items-center px-3 py-1.5 border border-amber-500/30 text-xs font-medium rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              title="Převede speciální znaky v prostém textu na platnou značku Typst"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Převést text na Typst
            </button>

            <button
              onClick={handleClearEditor}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-3 py-1.5 border border-slate-700 text-xs font-medium rounded-lg text-slate-300 bg-slate-800/60 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Vyčistit editor
            </button>
          </div>
        </div>
      </header>

      {/* Hlavní obsah */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-4">
        {/* Panel možností exportu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Možnosti exportu</h2>
            <p className="text-xs text-slate-400">Vyberte si mezi stažením zdrojového kódu nebo exportem do PDF.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tlačítko 1: Stáhnout .typ */}
            <button
              onClick={handleDownloadTyp}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl border border-slate-700 shadow-sm transition-all hover:border-slate-600 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Stáhnout .typ
            </button>

            {/* Tlačítko 2: Exportovat do PDF (CLI Engine) */}
            <button
              onClick={handleExportCli}
              disabled={status !== 'idle'}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {status === 'compiling-cli' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Probíhá kompilace...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Exportovat do PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Oznámení o úspěchu */}
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
              className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Zavřít
            </button>
          </div>
        )}

        {/* Kontejner textového editoru */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[600px]">
          {/* Lišta hlavičky editoru */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="inline-block w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-slate-200 tracking-wide shrink-0">
                document.typ
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 shrink-0">
              <span>{formatCount(lineCount, 'řádek', 'řádky', 'řádků')}</span>
              <span>{formatCount(wordCount, 'slovo', 'slova', 'slov')}</span>
              <span>{formatCount(charCount, 'znak', 'znaky', 'znaků')}</span>
            </div>
          </div>

          {/* Textová oblast editoru */}
          <div className="relative flex-1 flex bg-slate-100 min-h-[550px] sm:min-h-[600px]">
            {/* Sloupec s čísly řádků */}
            <div className="bg-slate-200/80 text-slate-500 font-mono text-sm py-4 px-3 select-none text-right border-r border-slate-300 hidden sm:block min-w-[3.5rem] shrink-0">
              {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Vstup pro text / kód */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Zadejte text nebo kód Typst..."
              spellCheck={false}
              className="w-full h-full min-h-[550px] sm:min-h-[600px] p-4 sm:p-6 bg-slate-100 text-slate-900 placeholder-slate-400 font-mono text-sm sm:text-base leading-relaxed border-0 focus:outline-none focus:ring-0 resize-y selection:bg-indigo-500 selection:text-white custom-scrollbar"
            />
          </div>
        </div>
      </main>

      {/* Modální okno pro chyby kompilace */}
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
                  <p className="text-xs text-rose-400">Kompilace Typst selhala. Zkontrolujte níže uvedené chyby syntaxe:</p>
                </div>
              </div>

              <button
                onClick={() => setErrorDetails(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Podrobnosti zprávy o chybě */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-80">
              <pre className="text-xs font-mono text-rose-300 whitespace-pre-wrap leading-relaxed">
                {errorDetails.message}
              </pre>
            </div>

            {/* Akce v modálním okně */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorDetails.message);
                  alert('Podrobnosti o chybě byly zkopírovány do schránky.');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Kopírovat chybu
              </button>
              <button
                onClick={() => setErrorDetails(null)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg shadow-md transition-colors cursor-pointer"
              >
                Zavřít a upravit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zápatí */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Generátor dokumentů Typst & Export do PDF — Připraveno pro Vercel & Typst CLI
      </footer>
    </div>
  );
}
