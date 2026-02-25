import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  /**
   * Generates a canvas from an HTML element using html2canvas.
   * @param element The HTML element to capture.
   * @param options Optional html2canvas configuration.
   */
  async generateCanvas(
    element: HTMLElement,
    options: any = {},
  ): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false,
      imageTimeout: 0,
      ...options,
    });
  }

  /**
   * Creates a new jsPDF instance.
   * @param options Optional jsPDF configuration.
   */
  createPdf(options: any = {}): jsPDF {
    return new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 2,
      filters: ['ASCIIHexEncode'],
      ...options,
    });
  }

  /**
   * Utility to handle common PDF generation logic can be added here if needed.
   */
}
