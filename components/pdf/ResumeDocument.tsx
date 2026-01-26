import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Link,
    PDFViewer,
    Font
} from '@react-pdf/renderer';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeData {
    personal: {
        fullName: string;
        role: string;
        email: string;
        phone: string;
        location: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    summaryHtml: string;
    skills: string[];
    experience: Array<{
        title: string;
        subtitle: string;
        date: string;
        descriptionHtml: string;
    }>;
    education: Array<{
        title: string;
        subtitle: string;
        date: string;
        descriptionHtml?: string;
    }>;
    courses?: Array<{
        title: string;
        provider: string;
        date: string;
    }>;
    projects: Array<{
        title: string;
        descriptionHtml: string;
        url?: string;
        tech: string[];
    }>;
}

// ============================================================================
// HTML UTILS
// ============================================================================

function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractListItems(html: string): string[] {
    if (!html) return [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: string[] = [];
    let match;
    while ((match = liRegex.exec(html)) !== null) {
        const text = stripHtml(match[1]);
        if (text) items.push(text);
    }
    if (items.length === 0) {
        const plain = stripHtml(html);
        if (plain) items.push(plain);
    }
    return items;
}

// ============================================================================
// FONTS & STYLES
// ============================================================================

Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
    ]
});

const colors = {
    primary: '#1a1a2e',
    secondary: '#4a4a6a',
    accent: '#0066cc',
    muted: '#666666',
    border: '#e0e0e0',
    background: '#ffffff',
};

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: colors.background,
        padding: 40,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: colors.primary,
    },

    // Header
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: colors.secondary,
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    contactItem: {
        fontSize: 9,
        color: colors.muted,
    },
    contactLink: {
        fontSize: 9,
        color: colors.accent,
        textDecoration: 'none',
    },
    contactSeparator: {
        fontSize: 9,
        color: colors.muted,
        marginHorizontal: 4,
    },

    // Sections
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    // Summary
    summaryText: {
        fontSize: 10,
        color: colors.secondary,
        lineHeight: 1.5,
    },

    // Skills
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    skillTag: {
        fontSize: 9,
        color: colors.primary,
        backgroundColor: '#f0f0f0',
        padding: '4 8',
        borderRadius: 3,
    },

    // Experience / Education Items
    itemContainer: {
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    itemTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },
    itemDate: {
        fontSize: 9,
        color: colors.muted,
        fontStyle: 'italic',
    },
    itemSubtitle: {
        fontSize: 10,
        color: colors.secondary,
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 9,
        color: colors.secondary,
        lineHeight: 1.4,
    },

    // Bullet points
    bulletContainer: {
        marginTop: 4,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 10,
        fontSize: 9,
        color: colors.accent,
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
        color: colors.secondary,
        lineHeight: 1.4,
    },

    // Projects
    projectTech: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    techTag: {
        fontSize: 8,
        color: colors.accent,
        backgroundColor: '#e6f0ff',
        padding: '2 6',
        borderRadius: 2,
    },
});

// ============================================================================
// COMPONENTS
// ============================================================================

interface BulletListProps {
    items: string[];
}

const BulletList: React.FC<BulletListProps> = ({ items }) => (
    <View style={styles.bulletContainer}>
        {items.map((item, index) => (
            <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
            </View>
        ))}
    </View>
);

interface ResumeSectionProps {
    title: string;
    children: React.ReactNode;
}

const ResumeSection: React.FC<ResumeSectionProps> = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

// ============================================================================
// MAIN DOCUMENT
// ============================================================================

interface ResumeDocumentProps {
    data: ResumeData;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data }) => {
    const { personal, summaryHtml, skills, experience, education, courses, projects } = data;

    // Build contact items
    const contactItems: React.ReactNode[] = [];
    if (personal.email) {
        contactItems.push(
            <Link key="email" style={styles.contactLink} src={`mailto:${personal.email}`}>
                {personal.email}
            </Link>
        );
    }
    if (personal.phone) {
        contactItems.push(<Text key="phone" style={styles.contactItem}>{personal.phone}</Text>);
    }
    if (personal.location) {
        contactItems.push(<Text key="location" style={styles.contactItem}>{personal.location}</Text>);
    }
    if (personal.linkedin) {
        contactItems.push(
            <Link key="linkedin" style={styles.contactLink} src={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`}>
                LinkedIn
            </Link>
        );
    }
    if (personal.github) {
        contactItems.push(
            <Link key="github" style={styles.contactLink} src={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`}>
                GitHub
            </Link>
        );
    }
    if (personal.website) {
        contactItems.push(
            <Link key="website" style={styles.contactLink} src={personal.website.startsWith('http') ? personal.website : `https://${personal.website}`}>
                Website
            </Link>
        );
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{personal.fullName || 'Seu Nome'}</Text>
                    {personal.role && <Text style={styles.role}>{personal.role}</Text>}
                    <View style={styles.contactRow}>
                        {contactItems.map((item, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <Text style={styles.contactSeparator}>|</Text>}
                                {item}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Summary */}
                {summaryHtml && stripHtml(summaryHtml) && (
                    <ResumeSection title="Resumo Profissional">
                        <Text style={styles.summaryText}>{stripHtml(summaryHtml)}</Text>
                    </ResumeSection>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <ResumeSection title="Competências">
                        <View style={styles.skillsContainer}>
                            {skills.map((skill, index) => (
                                <Text key={index} style={styles.skillTag}>{skill}</Text>
                            ))}
                        </View>
                    </ResumeSection>
                )}

                {/* Experience */}
                {experience && experience.length > 0 && (
                    <ResumeSection title="Experiência Profissional">
                        {experience.map((exp, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{exp.title}</Text>
                                    <Text style={styles.itemDate}>{exp.date}</Text>
                                </View>
                                <Text style={styles.itemSubtitle}>{exp.subtitle}</Text>
                                <BulletList items={extractListItems(exp.descriptionHtml)} />
                            </View>
                        ))}
                    </ResumeSection>
                )}

                {/* Education */}
                {education && education.length > 0 && (
                    <ResumeSection title="Formação Acadêmica">
                        {education.map((edu, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{edu.title}</Text>
                                    <Text style={styles.itemDate}>{edu.date}</Text>
                                </View>
                                <Text style={styles.itemSubtitle}>{edu.subtitle}</Text>
                            </View>
                        ))}
                    </ResumeSection>
                )}

                {/* Courses */}
                {courses && courses.length > 0 && (
                    <ResumeSection title="Cursos e Certificações">
                        {courses.map((course, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{course.title}</Text>
                                    <Text style={styles.itemDate}>{course.date}</Text>
                                </View>
                                <Text style={styles.itemSubtitle}>{course.provider}</Text>
                            </View>
                        ))}
                    </ResumeSection>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                    <ResumeSection title="Projetos">
                        {projects.map((project, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{project.title}</Text>
                                    {project.url && (
                                        <Link style={styles.contactLink} src={project.url.startsWith('http') ? project.url : `https://${project.url}`}>
                                            Ver Projeto
                                        </Link>
                                    )}
                                </View>
                                <Text style={styles.itemDescription}>{stripHtml(project.descriptionHtml)}</Text>
                                {project.tech && project.tech.length > 0 && (
                                    <View style={styles.projectTech}>
                                        {project.tech.map((t, i) => (
                                            <Text key={i} style={styles.techTag}>{t}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </ResumeSection>
                )}
            </Page>
        </Document>
    );
};

// ============================================================================
// PDF VIEWER WRAPPER
// ============================================================================

interface ResumePreviewProps {
    data: ResumeData;
    width?: string | number;
    height?: string | number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
    data,
    width = '100%',
    height = '100vh'
}) => {
    // Suppress specfic pdf.js warning "TT: undefined function"
    React.useEffect(() => {
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('TT: undefined function')) {
                return;
            }
            originalWarn(...args);
        };
        return () => {
            console.warn = originalWarn;
        };
    }, []);

    return (
        <PDFViewer width={width} height={height} showToolbar={true}>
            <ResumeDocument data={data} />
        </PDFViewer>
    );
};

export type { ResumeData };
export default ResumeDocument;
