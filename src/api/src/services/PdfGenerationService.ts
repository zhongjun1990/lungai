// PDF Generation Service using PDFKit
import PDFDocument from 'pdfkit';
import { Report, AnalysisResult } from '../types';

interface PatientInfo {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

interface StudyInfo {
  id: string;
  studyDate: string;
  modality: string;
  bodyPart?: string;
  description?: string;
  physicianName?: string;
}

export interface ReportData {
  report: Report;
  patient: PatientInfo;
  study: StudyInfo;
  analysisResult?: AnalysisResult;
}

export class PdfGenerationService {
  generateReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.addHeader(doc, data);
      this.addPatientInfo(doc, data.patient);
      this.addStudyInfo(doc, data.study);
      this.addAnalysisResults(doc, data.analysisResult);
      this.addReportContent(doc, data.report);
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, data: ReportData): void {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('AI Medical Imaging Analysis Report', 50, 50);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Report ID: ${data.report.id}`, 50, 90);
    doc.text(`Generated: ${new Date(data.report.createdAt).toLocaleString()}`, 50, 105);
    doc.text(`Status: ${this.formatStatus(data.report.status)}`, 50, 120);

    doc.moveDown();
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      review: 'Under Review',
      approved: 'Approved',
      signed: 'Signed',
      archived: 'Archived',
    };
    return statusMap[status] || status;
  }

  private addPatientInfo(doc: PDFKit.PDFDocument, patient: PatientInfo): void {
    const yPosition = doc.y;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Patient Information', 50, yPosition);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`MRN: ${patient.mrn}`, 50, yPosition + 20)
      .text(`Name: ${patient.lastName} ${patient.firstName}`, 50, yPosition + 35)
      .text(`Birth Date: ${patient.birthDate}`, 50, yPosition + 50)
      .text(`Gender: ${this.formatGender(patient.gender)}`, 50, yPosition + 65);

    doc.moveDown();
  }

  private formatGender(gender: string): string {
    const genderMap: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      unknown: 'Unknown',
    };
    return genderMap[gender] || gender;
  }

  private addStudyInfo(doc: PDFKit.PDFDocument, study: StudyInfo): void {
    const yPosition = doc.y;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Study Information', 50, yPosition);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Study Date: ${study.studyDate}`, 50, yPosition + 20)
      .text(`Modality: ${study.modality}`, 50, yPosition + 35);

    if (study.bodyPart) {
      doc.text(`Body Part: ${study.bodyPart}`, 50, yPosition + 50);
    }

    if (study.description) {
      doc.text(`Description: ${study.description}`, 50, yPosition + 65);
    }

    if (study.physicianName) {
      doc.text(`Physician: ${study.physicianName}`, 50, yPosition + 80);
    }

    doc.moveDown();
  }

  private addAnalysisResults(doc: PDFKit.PDFDocument, analysisResult?: AnalysisResult): void {
    if (!analysisResult) {
      return;
    }

    const yPosition = doc.y;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('AI Analysis Results', 50, yPosition);

    if (analysisResult.metrics) {
      const metricsY = yPosition + 20;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Model: ${analysisResult.modelId} v${analysisResult.modelVersion}`, 50, metricsY);

      if (analysisResult.metrics.inferenceTimeMs) {
        const seconds = (analysisResult.metrics.inferenceTimeMs / 1000).toFixed(2);
        doc.text(`Inference Time: ${seconds} seconds`, 50, metricsY + 15);
      }

      if (analysisResult.metrics.totalFindings) {
        doc.text(`Findings: ${analysisResult.metrics.totalFindings}`, 50, metricsY + 30);
      }

      if (analysisResult.metrics.confidenceScore) {
        const percentage = (analysisResult.metrics.confidenceScore * 100).toFixed(1);
        doc.text(`Average Confidence: ${percentage}%`, 50, metricsY + 45);
      }

      doc.moveDown();
    }

    if (analysisResult.findings && analysisResult.findings.length > 0) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Findings:', 50, doc.y);

      analysisResult.findings.forEach((finding, index) => {
        const findingY = doc.y;
        const confidence = (finding.confidence * 100).toFixed(1);

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${this.formatFindingType(finding.type)} (${confidence}%)`, 50, findingY);

        if (finding.description) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Description: ${finding.description}`, 65, findingY + 15);
        }

        if (finding.bbox) {
          doc.text(
            `Location: x=${finding.bbox.x}, y=${finding.bbox.y}, w=${finding.bbox.width}, h=${finding.bbox.height}`,
            65,
            findingY + 30
          );
        }

        if (finding.volume) {
          doc.text(`Estimated Volume: ${finding.volume.toFixed(2)} mm³`, 65, findingY + 45);
        }

        doc.moveDown();
      });
    }

    if (analysisResult.reportText) {
      const reportY = doc.y;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Report Text:', 50, reportY);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(analysisResult.reportText, 50, reportY + 15, {
          width: 500,
          align: 'justify',
        });

      doc.moveDown();
    }
  }

  private formatFindingType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private addReportContent(doc: PDFKit.PDFDocument, report: Report): void {
    if (!report.content || Object.keys(report.content).length === 0) {
      return;
    }

    const yPosition = doc.y;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Report Content', 50, yPosition);

    Object.entries(report.content).forEach(([key, value], index) => {
      const contentY = yPosition + 20 + index * 30;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(this.formatContentKey(key), 50, contentY);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(String(value), 50, contentY + 15, {
          width: 500,
          align: 'justify',
        });
    });

    doc.moveDown();
  }

  private formatContentKey(key: string): string {
    return key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/^./, (match) => match.toUpperCase());
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageNumber = doc.page;
    const totalPages = 1; // PDFKit doesn't track total pages until end

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `AI Medical Imaging Analysis Platform - Page ${pageNumber} of ${totalPages}`,
        50,
        doc.page.height - 40,
        {
          width: 500,
          align: 'center',
        }
      );

    doc.text(
      'This report contains preliminary AI-assisted analysis and should be reviewed by a qualified medical professional.',
      50,
      doc.page.height - 30,
      {
        width: 500,
        align: 'center',
      }
    );
  }
}

export const pdfGenerationService = new PdfGenerationService();
