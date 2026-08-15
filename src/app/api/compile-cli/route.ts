import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

export async function POST(request: Request) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid Request', details: 'Missing or invalid "content" in request body.' },
        { status: 400 }
      );
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    inputPath = path.join(tempDir, `typst-${uniqueId}.typ`);
    outputPath = path.join(tempDir, `typst-${uniqueId}.pdf`);

    // Write typst source file
    await fs.promises.writeFile(inputPath, content, 'utf-8');

    // Locate Typst CLI binary
    const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'typst.exe' : 'typst');
    let typstBin = 'typst';

    if (fs.existsSync(localBin)) {
      typstBin = localBin;
    }

    // Execute Typst CLI
    try {
      await execFileAsync(typstBin, ['compile', inputPath, outputPath]);
    } catch (err) {
      const execErr = err as ExecError;
      const details = execErr.stderr || execErr.stdout || execErr.message || 'Typst CLI compilation failed.';
      return NextResponse.json(
        { error: 'Typst Compilation Error', details: details.trim() },
        { status: 422 }
      );
    }

    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: 'Compilation Error', details: 'Typst compilation completed but output PDF was not found.' },
        { status: 500 }
      );
    }

    const pdfBuffer = await fs.promises.readFile(outputPath);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: 'Server Error', details: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  } finally {
    // Safe cleanup of temp files
    if (inputPath && fs.existsSync(inputPath)) {
      await fs.promises.unlink(inputPath).catch(() => {});
    }
    if (outputPath && fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath).catch(() => {});
    }
  }
}
