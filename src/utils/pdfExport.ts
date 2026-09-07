import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4';
  filename?: string;
  marginMm?: number;
  quality?: number;
  scale?: number;
  onProgress?: (status: { percent: number; step: string }) => void;
}

/**
 * Exports a DOM element to an A4 PDF document with multi-page automatic slicing.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; filename: string }> {
  const {
    orientation = 'portrait',
    filename = `Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`,
    quality = 0.95,
    scale = 2,
    onProgress
  } = options;

  try {
    onProgress?.({ percent: 10, step: 'Menyiapkan elemen laporan...' });

    // A4 dimensions in millimeters
    const isLandscape = orientation === 'landscape';
    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;

    onProgress?.({ percent: 30, step: 'Merender grafik & data laporan ke canvas resolusi tinggi...' });

    // Render DOM to high-res canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth || element.scrollWidth,
      onclone: (clonedDoc) => {
        // Hide print-hidden and interactive controls in cloned view
        const hideElements = clonedDoc.querySelectorAll(
          '.print\\:hidden, [data-print-hidden="true"], .no-print, [data-pdf-hidden="true"]'
        );
        hideElements.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        // Ensure white background, clean text, and visible overflow on root cloned container
        const clonedContainer = clonedDoc.getElementById(element.id) || clonedDoc.body;
        if (clonedContainer) {
          (clonedContainer as HTMLElement).style.backgroundColor = '#ffffff';
          (clonedContainer as HTMLElement).style.color = '#0f172a';
          (clonedContainer as HTMLElement).style.boxShadow = 'none';
          (clonedContainer as HTMLElement).style.overflow = 'visible';
          (clonedContainer as HTMLElement).style.maxHeight = 'none';
          (clonedContainer as HTMLElement).style.height = 'auto';
        }
      },
    });

    onProgress?.({ percent: 65, step: 'Menghitung halaman dan menyusun dokumen PDF...' });

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate canvas height corresponding to one A4 page
    const pageCanvasHeight = Math.floor(canvasWidth * (pageHeightMm / pageWidthMm));
    const totalPages = Math.ceil(canvasHeight / pageCanvasHeight);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      onProgress?.({
        percent: 70 + Math.floor((pageIdx / totalPages) * 20),
        step: `Menyusun halaman ${pageIdx + 1} dari ${totalPages}...`
      });

      const sourceY = pageIdx * pageCanvasHeight;
      const currentSliceHeight = Math.min(pageCanvasHeight, canvasHeight - sourceY);

      // Create a temporary page canvas for exact page slicing
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = currentSliceHeight;
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, currentSliceHeight);

        // Draw image slice
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvasWidth,
          currentSliceHeight,
          0,
          0,
          canvasWidth,
          currentSliceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', quality);
        const sliceHeightMm = (currentSliceHeight * pageWidthMm) / canvasWidth;

        if (pageIdx > 0) {
          pdf.addPage('a4', isLandscape ? 'l' : 'p');
        }

        pdf.addImage(pageImgData, 'JPEG', 0, 0, pageWidthMm, sliceHeightMm, undefined, 'FAST');

        // Clean watermark / footer metadata on each page
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // Slate 400
        const footerText = `Dokumen Resmi KCK CRM • Halaman ${pageIdx + 1} dari ${totalPages}`;
        pdf.text(footerText, pageWidthMm / 2, pageHeightMm - 4, { align: 'center' });
      }
    }

    onProgress?.({ percent: 95, step: 'Menyimpan dan mengunduh file PDF...' });

    // Trigger download with reliable iframe fallback
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.warn('pdf.save direct call failed, triggering fallback Blob download:', saveErr);
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }

    onProgress?.({ percent: 100, step: 'Selesai!' });
    return { success: true, filename };
  } catch (error) {
    console.error('Error during PDF export:', error);
    throw error;
  }
}

/**
 * Fallback browser printing with iframe to prevent sandbox parent issues
 */
export function safePrintDocument(elementId: string): void {
  try {
    // Attempt standard print first
    window.print();
  } catch (err) {
    console.warn('Direct window.print() was blocked or failed:', err);
    // Fallback: create an iframe print context
    const element = document.getElementById(elementId);
    if (!element) return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Laporan Keuangan - KCK CRM</title>
            <style>
              body { font-family: system-ui, sans-serif; margin: 20px; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; }
              th { background-color: #f1f5f9; }
              .print-hidden { display: none !important; }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch {
          console.error('Iframe print also restricted.');
        } finally {
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        }
      }, 500);
    }
  }
}
