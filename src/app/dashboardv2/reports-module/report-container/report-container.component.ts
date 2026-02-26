import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { MessageService } from 'primeng/api';
import { KpiHelperService } from 'src/app/services/kpi-helper.service';
import { MetricsService } from 'src/app/services/metrics.service';
import { SharedService } from 'src/app/services/shared.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PdfService } from 'src/app/services/pdf.service';

@Component({
  selector: 'app-report-container',
  templateUrl: './report-container.component.html',
  styleUrls: ['./report-container.component.css'],
})
export class ReportContainerComponent implements OnInit {
  chartData: any;
  widthObj = { 100: 'p-col-12', 50: 'p-col-6', 66: 'p-col-8', 33: 'p-col-4' };
  reportsData: any[] = [];
  selectedReport: any;

  // Reference to the scrollable container element
  @ViewChild('sliderContainer', { static: false })
  sliderContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('printableReport') printableReport: ElementRef;

  constructor(
    private http: HttpService,
    private messageService: MessageService,
    private kpiHelperService: KpiHelperService,
    private readonly metrics: MetricsService,
    public readonly sharedService: SharedService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Initializes the component by fetching reports data and processing the first report's KPIs.
   * It sets the selected report and parses the chart data for each KPI.
   *
   * @returns - No return value.
   */
  ngOnInit(): void {
    this.getReportsData();
  }

  /**
   * Converts the chartData property of each KPI in the report from a JSON string to an object,
   * if it is currently a string. Updates the selectedReport with the modified report.
   *
   * @param report - The report object containing KPIs with potential chartData as a string.
   * @returns void
   */
  generateChartData(report) {
    if (typeof report.kpis[0].chartData === 'string') {
      report.kpis.forEach((kpi) => {
        kpi.chartData = JSON.parse(kpi.chartData);
      });
    }
    this.selectedReport = report;
  }

  /**
   * Retrieves the width value associated with the specified KPI width key.
   * If the key does not exist, it defaults to 'p-col-6'.
   *
   * @param kpiwidth - The key for which to retrieve the width value.
   * @returns The width value as a string, or 'p-col-6' if the key is not found.
   * @throws No exceptions are thrown.
   */
  getkpiwidth(kpiwidth) {
    const retValue = this.widthObj[kpiwidth]
      ? this.widthObj[kpiwidth]
      : 'p-col-8';
    return retValue;
  }

  scrollLeft(): void {
    this.sliderContainer.nativeElement.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
    this.setSelectedReport(
      this.kpiHelperService.getSelectedItem(
        this.reportsData,
        this.selectedReport,
        'left',
      ),
    );
  }

  scrollRight(): void {
    this.sliderContainer.nativeElement.scrollBy({
      left: 200,
      behavior: 'smooth',
    });
    this.setSelectedReport(
      this.kpiHelperService.getSelectedItem(
        this.reportsData,
        this.selectedReport,
        'right',
      ),
    );
  }

  setSelectedReport(report) {
    this.metrics.trackReportSelection(report?.name || 'unknown');
    Promise.resolve(null).then(() => {
      this.generateChartData(report);
    });
  }

  /**
   * Extracts the values from the given object and returns them as an array.
   * @param obj - The object from which to extract values.
   * @returns An array of values from the object, or an empty array if the object is null or has no keys.
   * @throws No exceptions are thrown by this function.
   */
  objectValues(obj): any[] {
    // return this.helperService.getObjectKeys(obj)
    const result = [];
    if (obj && Object.keys(obj)?.length) {
      Object.keys(obj).forEach((x) => {
        result.push(obj[x]);
      });
    }
    return result;
  }

  objectKeys(obj) {
    return obj && Object.keys(obj)?.length ? Object.keys(obj) : [];
  }

  /**
   * Removes a specified KPI from the selected report and updates the report on the server.
   * @param selectedReport - The report object from which the KPI will be removed.
   * @param kpi - The KPI object to be deleted from the report.
   * @returns void
   * @throws Error if the HTTP request fails or the response indicates an error.
   */
  deleteKPIFromReport(selectedReport, kpi) {
    selectedReport.kpis = selectedReport.kpis.filter((x) => x.id !== kpi.id);
    const data = { ...selectedReport };
    data.kpis.forEach((element) => {
      element.chartData = JSON.stringify(element.chartData);
    });

    const reportId = selectedReport.id;
    this.http.updateReport(reportId, data).subscribe((data) => {
      if (data['success']) {
        data['data']['kpis'].forEach((element) => {
          element.chartData = JSON.parse(element.chartData);
        });
        selectedReport.kpis = data['data']['kpis'];
        this.messageService.add({
          severity: 'success',
          summary: 'KPI deleted successfully.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error while updating report',
        });
      }
    });
  }

  segregateSprints(additional_filters, key, superkey) {
    if (key.toLowerCase() === 'sprint') {
      return additional_filters[key]
        .filter((elem) => elem.parentId === superkey.nodeId)
        .map((elem) => elem.nodeDisplayName)
        .join(', ');
    } else {
      return additional_filters[key]
        .map((elem) => elem.nodeDisplayName)
        .join(', ');
    }
  }

  async printReport() {
    this.metrics.trackReportPrint(this.selectedReport?.name || 'unknown');
    await this.exportAsPDF();
  }

  private async prepareElementForCapture(element: HTMLElement): Promise<
    Map<
      HTMLElement,
      {
        height: string;
        maxHeight: string;
        overflow: string;
        overflowX: string;
        overflowY: string;
      }
    >
  > {
    const originalStyles = new Map<
      HTMLElement,
      {
        height: string;
        maxHeight: string;
        overflow: string;
        overflowX: string;
        overflowY: string;
      }
    >();

    const scrollableElements = Array.from(element.querySelectorAll('*')).filter(
      (el: HTMLElement) => {
        const computedStyle = window.getComputedStyle(el);
        const overflow = computedStyle.overflow;
        const overflowX = computedStyle.overflowX;
        const overflowY = computedStyle.overflowY;
        return (
          overflow === 'auto' ||
          overflow === 'scroll' ||
          overflowX === 'auto' ||
          overflowX === 'scroll' ||
          overflowY === 'auto' ||
          overflowY === 'scroll'
        );
      },
    );

    scrollableElements.forEach((el: HTMLElement) => {
      originalStyles.set(el, {
        height: el.style.height,
        maxHeight: el.style.maxHeight,
        overflow: el.style.overflow,
        overflowX: el.style.overflowX,
        overflowY: el.style.overflowY,
      });
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
    });

    return originalStyles;
  }

  private restoreElementStyles(
    originalStyles: Map<
      HTMLElement,
      {
        height: string;
        maxHeight: string;
        overflow: string;
        overflowX: string;
        overflowY: string;
      }
    >,
  ): void {
    originalStyles.forEach((styles, element) => {
      element.style.height = styles.height;
      element.style.maxHeight = styles.maxHeight;
      element.style.overflow = styles.overflow;
      element.style.overflowX = styles.overflowX;
      element.style.overflowY = styles.overflowY;
    });
  }

  async exportAsPDF(): Promise<void> {
    try {
      const reportElement = document.getElementById('printable-report');
      const headerElement = document.getElementById('printable-header');
      if (!reportElement) {
        throw new Error('Report element not found');
      }

      const kpiElements = Array.from(
        reportElement.querySelectorAll('.kpi-div'),
      ).filter((el: any) => el.style.display !== 'none');
      if (kpiElements.length === 0) {
        throw new Error('No visible KPIs found');
      }

      const pdfInstance = this.pdfService.createPdf();

      const padding = 10;
      const pageWidth = pdfInstance.internal.pageSize.getWidth();
      const pageHeight = pdfInstance.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * padding;

      const userDetails = this.sharedService.getCurrentUserDetails();

      for (let i = 0; i < kpiElements.length; i++) {
        const kpiElement = kpiElements[i] as HTMLElement;

        // Create a temporary container for individual KPI capture
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = reportElement.offsetWidth + 'px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '20px';

        if (i === 0) {
          // Add App Header and Report Title on the first page
          const appHeader = document.createElement('div');
          appHeader.style.display = 'flex';
          appHeader.style.justifyContent = 'space-between';
          appHeader.style.alignItems = 'center';
          appHeader.style.borderBottom = '1px solid #eee';
          appHeader.style.paddingBottom = '10px';
          appHeader.style.marginBottom = '20px';

          const logoImg = document.createElement('img');
          logoImg.src = 'assets/img/PSKnowHowLogo.svg';
          logoImg.style.height = '30px';
          appHeader.appendChild(logoImg);

          if (userDetails && userDetails['user_name']) {
            const userNameContainer = document.createElement('div');
            userNameContainer.style.fontSize = '14px';
            userNameContainer.innerText = userDetails['user_name'];
            appHeader.appendChild(userNameContainer);
          }
          tempContainer.appendChild(appHeader);

          if (headerElement) {
            const headerClone = headerElement.cloneNode(true) as HTMLElement;
            headerClone.style.display = 'block';
            headerClone.style.marginBottom = '20px';
            headerClone.style.textAlign = 'center';
            tempContainer.appendChild(headerClone);
          }
        }

        const kpiClone = kpiElement.cloneNode(true) as HTMLElement;
        kpiClone.style.width = '100%';
        kpiClone.style.marginBottom = '0';

        // Remove delete buttons from clone
        const deleteButtons = kpiClone.querySelectorAll('.delete-kpi-btn');
        deleteButtons.forEach((btn: any) => btn.remove());

        tempContainer.appendChild(kpiClone);
        document.body.appendChild(tempContainer);

        const originalStyles = await this.prepareElementForCapture(
          tempContainer,
        );

        const canvas = await this.pdfService.generateCanvas(tempContainer, {
          height: tempContainer.scrollHeight,
          windowHeight: tempContainer.scrollHeight,
        });

        this.restoreElementStyles(originalStyles);
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const imgProps = pdfInstance.getImageProperties(imgData);
        const pdfWidth = contentWidth;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        const position = padding;

        // If it's not the first page, we already added a page in the previous iteration
        if (i > 0) {
          pdfInstance.addPage();
        }

        // Handle scaling if KPI is still taller than a page (rare for one KPI, but possible for multi-row tables)
        if (pdfHeight > pageHeight - 2 * padding) {
          // Fit to page height if it exceeds
          const scaledWidth =
            (pdfWidth * (pageHeight - 2 * padding)) / pdfHeight;
          const centeredX = (pageWidth - scaledWidth) / 2;
          pdfInstance.addImage(
            imgData,
            'JPEG',
            centeredX,
            position,
            scaledWidth,
            pageHeight - 2 * padding,
            undefined,
            'FAST',
          );
        } else {
          const centeredX = (pageWidth - pdfWidth) / 2;
          pdfInstance.addImage(
            imgData,
            'JPEG',
            centeredX,
            position,
            pdfWidth,
            pdfHeight,
            undefined,
            'FAST',
          );
        }

        // Cover margins
        pdfInstance.setFillColor(255, 255, 255);
        pdfInstance.rect(0, 0, pageWidth, padding, 'F');
        pdfInstance.rect(0, pageHeight - padding, pageWidth, padding, 'F');
      }

      // Trigger browser print using a hidden iframe
      pdfInstance.autoPrint();
      const pdfBlob = pdfInstance.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          URL.revokeObjectURL(pdfUrl);
        }, 100);
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'PDF Generation Failed',
        detail: error.message,
      });
    }
  }

  getReportsData() {
    this.http.fetchReports().subscribe((data) => {
      this.reportsData = data['data']['content'];

      this.selectedReport = this.reportsData[0];
      this.metrics.trackReportSelection(this.selectedReport?.name || 'unknown');
      this.selectedReport.kpis.forEach((kpi) => {
        kpi.chartData = JSON.parse(kpi.chartData);
      });
      this.generateChartData(this.reportsData[0]);
    });
  }

  removeReport(report: any, event: MouseEvent) {
    event.stopPropagation(); // Prevent triggering the button's onClick
    const deletedReportId = report?.id;
    this.http
      .deleteReport(deletedReportId)
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Report deleted successfully',
          });
          this.reportsData = this.reportsData.filter((r) => r !== report);
          // this.getReportsData();
        }),
        catchError((error) => {
          console.error('Error deleting report:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to delete report',
          });
          return of();
        }),
      )
      .subscribe();
  }
}
