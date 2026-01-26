import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { EditableCV, Section, SectionType, SectionItem } from '../types/cv';
import { CVAnalysis } from '../types/cv';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse CV from Analysis Result to Editable Format
 * Extracts structured data from the analysis for editing
 */
export function parseCVFromAnalysis(analysis: CVAnalysis, cvText?: string): EditableCV {
    const sections: Section[] = [];

    // 1. Personal Info (Placeholder as analysis might not have it structured)
    sections.push({
        id: 'personal',
        type: 'personal',
        title: 'Dados Pessoais',
        visible: true,
        collapsed: false,
        fields: {
            fullName: '',
            role: '',
            email: analysis.extracted_contacts?.email || '',
            phone: analysis.extracted_contacts?.phone || '',
            location: '',
            linkedin: ''
        }
    });

    // 2. Summary
    const summary = analysis.sections
        .find(s => s.name.toLowerCase().includes('resumo') || s.name.toLowerCase().includes('objetivo'))
        ?.suggestions?.join(' ') || '';

    sections.push({
        id: 'summary',
        type: 'richtext',
        title: 'Resumo Profissional',
        visible: true,
        collapsed: false,
        content: summary || 'Profissional qualificado com experiência comprovada.'
    });

    // 3. Experience
    const experienceSection = analysis.sections.find(s =>
        s.name.toLowerCase().includes('experiência') ||
        s.name.toLowerCase().includes('profissional')
    );

    const experienceItems: SectionItem[] = experienceSection?.suggestions?.map((sugg, index) => ({
        id: uuidv4(),
        title: '',
        subtitle: `Empresa ${index + 1}`,
        date: '',
        description: sugg
    })) || [{ id: uuidv4(), title: '', subtitle: '', date: '', description: '' }];

    sections.push({
        id: 'experience',
        type: 'repeatable_group',
        title: 'Experiência Profissional',
        visible: true,
        collapsed: false,
        items: experienceItems
    });

    // 4. Education
    const educationSection = analysis.sections.find(s =>
        s.name.toLowerCase().includes('educação') ||
        s.name.toLowerCase().includes('formação')
    );

    const educationItems: SectionItem[] = educationSection?.suggestions?.map((sugg, index) => ({
        id: uuidv4(),
        title: sugg,
        subtitle: `Instituição ${index + 1}`,
        date: '',
        description: ''
    })) || [{ id: uuidv4(), title: '', subtitle: '', date: '', description: '' }];

    sections.push({
        id: 'education',
        type: 'repeatable_group',
        title: 'Formação Acadêmica',
        visible: true,
        collapsed: false,
        items: educationItems
    });

    // 5. Skills
    const skillsSection = analysis.sections.find(s =>
        s.name.toLowerCase().includes('habilidade') ||
        s.name.toLowerCase().includes('competência')
    );

    const skills = skillsSection?.strengths || [''];

    sections.push({
        id: 'skills',
        type: 'list',
        title: 'Habilidades',
        visible: true,
        collapsed: false,
        list: skills
    });

    return {
        id: uuidv4(),
        sections,
        metadata: {
            template: 'default',
            lastUpdated: new Date().toISOString()
        }
    };
}

/**
 * Generate Professional PDF from CV Data
 */
export async function generatePDF(cvData: EditableCV): Promise<Blob> {
    const doc = new jsPDF();

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper to add text with word wrap
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setFont('helvetica', 'normal');
        }

        // Strip HTML tags for PDF generation (simple regex, can be improved)
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        const lines = doc.splitTextToSize(cleanText, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += (lines.length * fontSize * 0.5) + 5;
    };

    // Title (from Personal Info)
    const personal = cvData.sections.find(s => s.id === 'personal');
    doc.setFillColor(26, 188, 156); // Teal color
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(personal?.fields?.fullName || 'Currículo Profissional', pageWidth / 2, 25, { align: 'center' });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Iterate sections
    cvData.sections.forEach(section => {
        if (!section.visible) return;

        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }

        switch (section.type) {
            case 'richtext':
                if (section.content) {
                    addText(section.title.toUpperCase(), 14, true);
                    addText(section.content, 10);
                    yPosition += 5;
                }
                break;

            case 'repeatable_group':
                if (section.items && section.items.length > 0) {
                    addText(section.title.toUpperCase(), 14, true);
                    section.items.forEach(item => {
                        addText(`${item.title} - ${item.subtitle}`, 12, true);
                        if (item.date) addText(item.date, 9);
                        if (item.description) addText(item.description, 10);
                        yPosition += 3;
                    });
                }
                break;

            case 'list':
                if (section.list && section.list.length > 0) {
                    addText(section.title.toUpperCase(), 14, true);
                    addText(section.list.join(', '), 10);
                    yPosition += 5;
                }
                break;
        }
    });

    return doc.output('blob');
}

/**
 * Generate Professional DOCX from CV Data
 */
export async function generateDOCX(cvData: EditableCV): Promise<Blob> {
    const docSections: any[] = [];

    cvData.sections.forEach(section => {
        if (!section.visible) return;

        switch (section.type) {
            case 'richtext':
                if (section.content) {
                    docSections.push(
                        new Paragraph({
                            text: section.title.toUpperCase(),
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: section.content.replace(/<[^>]*>?/gm, ''),
                            spacing: { after: 400 }
                        })
                    );
                }
                break;

            case 'repeatable_group':
                if (section.items && section.items.length > 0) {
                    docSections.push(
                        new Paragraph({
                            text: section.title.toUpperCase(),
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        })
                    );

                    section.items.forEach(item => {
                        docSections.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${item.title} - ${item.subtitle}`,
                                        bold: true,
                                        size: 24
                                    })
                                ],
                                spacing: { after: 100 }
                            })
                        );

                        if (item.date) {
                            docSections.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item.date,
                                            italics: true,
                                            size: 20
                                        })
                                    ],
                                    spacing: { after: 100 }
                                })
                            );
                        }

                        if (item.description) {
                            docSections.push(
                                new Paragraph({
                                    text: item.description.replace(/<[^>]*>?/gm, ''),
                                    spacing: { after: 300 }
                                })
                            );
                        }
                    });
                }
                break;

            case 'list':
                if (section.list && section.list.length > 0) {
                    docSections.push(
                        new Paragraph({
                            text: section.title.toUpperCase(),
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: section.list.join(', '),
                            spacing: { after: 400 }
                        })
                    );
                }
                break;
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docSections
        }]
    });

    return await Packer.toBlob(doc);
}

/**
 * Download Blob as File
 */
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
