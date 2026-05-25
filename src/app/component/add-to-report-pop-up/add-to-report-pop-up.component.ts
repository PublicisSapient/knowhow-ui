import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-add-to-report-pop-up',
  templateUrl: './add-to-report-pop-up.component.html',
  styleUrls: ['./add-to-report-pop-up.component.css'],
})
export class AddToReportPopUpComponent implements AfterViewInit {
  @Input() reportObj: any;
  @Input() createNewReportTemplate = false;
  @Input() existingReportData: any[] = [];
  @Input() reportName = '';
  // Reference to the scrollable container element
  @ViewChild('sliderContainer', { static: false })
  sliderContainer!: ElementRef<HTMLDivElement>;
  @Input() xAxisLabel: string;
  @Input() yAxisLabel: string;

  constructor(private service: SharedService) {}

  ngOnChanges() {
    // Guard against cases where reportObj or its metadata may not yet be initialized
    if (
      this.reportObj &&
      this.reportObj.metadata &&
      this.reportObj.metadata.trendColors &&
      typeof this.reportObj.metadata.trendColors === 'object'
    ) {
      try {
        this.reportObj.metadata.trendColors = this.removeDuplicateKeys(
          this.reportObj.metadata.trendColors,
        );
      } catch (e) {
        // If canonicalization fails for some reason, leave trendColors as-is
        console.warn('Failed to dedupe trendColors for report preview', e);
      }
    }
  }

  ngAfterViewInit() {}

  /**
   * Returns a preview chart data object suitable for the report preview.
   * For multi-tab KPIs (kpi202), returns the selected tab wrapped in an array.
   * For single-tab KPIs, returns the chart data as-is.
   */
  get previewChart() {
    try {
      if (!this.reportObj || !this.reportObj.chartData) {
        return null;
      }

      const chartData = this.reportObj.chartData;
      const selectedTab = this.reportObj?.metadata?.selectedTab;

      // If chartData is an array of tab entries (multi-tab KPI like kpi202),
      // return the selected tab wrapped in an array for the template to render
      if (Array.isArray(chartData)) {
        if (selectedTab) {
          const found = chartData.find((c) => {
            if (!c) return false;
            const name = (c.tabName || '').toString().toLowerCase();
            return name === selectedTab.toString().toLowerCase();
          });
          if (found) {
            // Return as array so template loops through and renders the single selected tab
            return [found];
          }
        }
        // fallback: return first entry as array
        if (chartData[0]) {
          return [chartData[0]];
        }
        return null;
      }

      // If chartData is a wrapper with chartData property (common shape), return that
      if (chartData && chartData.chartData) {
        return chartData.chartData;
      }

      // otherwise return as provided
      return chartData;
    } catch (e) {
      console.warn('Error computing previewChart', e);
      return null;
    }
  }

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

  canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      // For arrays, canonicalize each element.
      return '[' + obj.map(this.canonicalize).join(',') + ']';
    }

    // For objects, sort keys, then canonicalize.
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    sortedKeys.forEach((key) => {
      sortedObj[key] = obj[key];
    });
    return JSON.stringify(sortedObj);
  }

  /**
   * Removes keys from an object whose values (after deep canonicalization) are duplicates.
   * @param inputObj - The input object.
   * @returns - A new object containing only unique value entries.
   */
  removeDuplicateKeys(inputObj) {
    const seen = new Set();
    const result = {};

    Object.keys(inputObj).forEach((key) => {
      // Create a canonical fingerprint for deep comparison.
      const fingerprint = this.canonicalize(inputObj[key]);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        result[key] = inputObj[key];
      }
    });

    return result;
  }

  scrollLeft(): void {
    this.sliderContainer.nativeElement.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
  }

  scrollRight(): void {
    this.sliderContainer.nativeElement.scrollBy({
      left: 200,
      behavior: 'smooth',
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
        .join(',');
    }
  }

  emitReportName(report) {
    this.service.onSelectedReportChange.next(report);
  }
}
