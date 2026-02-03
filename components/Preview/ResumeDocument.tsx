import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link, Image, Svg, Path } from '@react-pdf/renderer';
import { EditableCV, ResumeItem, Section } from '../../types/cv';

// Registra fontes (Roboto)
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
});

// CORES DO SITE
const colors = {
    accent: '#0f5156',
    darkText: '#111111',
    lightText: '#374151',
    mutedText: '#6b7280',
    bgSidebar: '#F8FAFC',
    divider: '#E5E7EB',
};

// Ícones SVG
const Icon = ({ path, color = colors.accent }: { path: string; color?: string }) => (
    <Svg viewBox="0 0 24 24" width={10} height={10} style={{ marginRight: 6 }}>
        <Path fill={color} d={path} />
    </Svg>
);

const Paths = {
    Mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    Phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    Pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    Linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
    Globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    Github: "M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z",
};

const styles = StyleSheet.create({
    page: { flexDirection: 'row', backgroundColor: '#FFFFFF', fontFamily: 'Roboto', padding: 0 },

    // --- SIDEBAR ---
    leftColumn: { width: '32%', backgroundColor: colors.bgSidebar, minHeight: '100%', paddingBottom: 20, borderRightWidth: 1, borderRightColor: colors.divider },
    headerCurve: { backgroundColor: colors.accent, minHeight: 160, borderBottomRightRadius: 60, padding: 15, paddingTop: 20, paddingBottom: 0, justifyContent: 'flex-start', marginBottom: 0 },
    name: { fontSize: 18, color: '#FFFFFF', fontWeight: 700, marginBottom: 6, lineHeight: 1.3, textAlign: 'center' },
    roleTitle: { fontSize: 11, color: '#c8e0e2', fontWeight: 500, textAlign: 'center', marginBottom: 12 },

    // Foto
    photoWrapper: { alignItems: 'center', marginTop: 0, marginBottom: -45 },
    photo: { width: 95, height: 95, borderRadius: 48, borderWidth: 4, borderColor: '#3d7a7f', objectFit: 'cover' },

    // Sidebar Seções
    sidebarSection: { paddingHorizontal: 15, marginBottom: 12 },
    sidebarTitle: { fontSize: 13, color: colors.accent, fontWeight: 500, marginBottom: 6 },
    sidebarDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 3, marginBottom: 8 },
    contactItem: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
    contactText: { fontSize: 9.5, color: colors.darkText, flex: 1, lineHeight: 1.4 },
    skillTag: { fontSize: 9, backgroundColor: '#E2E8F0', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, color: colors.darkText, marginBottom: 3, marginRight: 3 },
    skillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },

    // --- MAIN ---
    rightColumn: { width: '68%', padding: 25, paddingTop: 30 },
    sectionMain: { marginBottom: 16 },
    sectionTitleMain: { fontSize: 14, color: colors.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 3 },

    // Items
    itemBlock: { marginBottom: 10 },
    itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    itemTitle: { fontSize: 11, fontWeight: 700, color: colors.darkText, maxWidth: '70%' },
    itemDate: { fontSize: 10, fontWeight: 500, color: colors.accent, textAlign: 'right' },
    itemSubtitle: { fontSize: 10, fontWeight: 500, color: colors.lightText, marginBottom: 3 },
    description: { fontSize: 9.5, lineHeight: 1.5, color: colors.lightText, textAlign: 'left' },
    bulletRow: { flexDirection: 'row', marginBottom: 2, paddingLeft: 4 },
    bulletPoint: { width: 8, fontSize: 10, color: colors.accent },
    bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5, color: colors.lightText },
});

// Helper para limpar HTML
const FormattedText = ({ text }: { text?: string }) => {
    if (!text) return null;
    let cleanText = text
        .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<p>/gi, '').replace(/<ul>/gi, '').replace(/<\/ul>/gi, '')
        .replace(/<li>/gi, '• ').replace(/<\/li>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
    const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
    return (
        <View>
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    return (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletText}>{trimmed.substring(1).trim()}</Text>
                        </View>
                    );
                }
                return <Text key={index} style={styles.description}>{trimmed}</Text>;
            })}
        </View>
    );
};

const cleanDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return String(dateStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/(\d)\s+(\d)/g, '$1$2').replace(/\s*\/\s*/g, '/');
};

export const ResumeDocument: React.FC<{ data: EditableCV }> = ({ data }) => {
    const getSection = (id: string): Section | undefined => data.sections?.find(s => s.id === id);

    const personal = getSection('personal')?.fields || {};
    const summary = getSection('summary')?.content || '';
    const experienceItems = (getSection('experience')?.items || []) as ResumeItem[];
    const educationItems = (getSection('education')?.items || []) as ResumeItem[];
    const coursesItems = (getSection('courses')?.items || []) as ResumeItem[];
    const skillsList = getSection('skills')?.list || [];

    const fullName = `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Seu Nome';
    const role = personal.role || '';
    const photoUrl = personal.photo || null;
    const location = [personal.city].filter(Boolean).join(', ');

    return (
        <Document title={`${fullName} - Currículo`}>
            <Page size="A4" style={styles.page}>

                {/* SIDEBAR */}
                <View style={styles.leftColumn}>
                    <View style={styles.headerCurve}>
                        <Text style={styles.name}>{fullName}</Text>
                        {role && <Text style={styles.roleTitle}>{role}</Text>}

                        {/* Foto dentro do header */}
                        {photoUrl && (
                            <View style={styles.photoWrapper}>
                                <Image src={photoUrl} style={styles.photo} />
                            </View>
                        )}
                    </View>

                    {/* Dados Pessoais */}
                    <View style={[styles.sidebarSection, { marginTop: 55 }]}>
                        <Text style={styles.sidebarTitle}>Dados Pessoais</Text>
                        <View style={styles.sidebarDivider} />

                        {personal.email && (
                            <View style={styles.contactItem}>
                                <Icon path={Paths.Mail} />
                                <Text style={styles.contactText}>{personal.email}</Text>
                            </View>
                        )}
                        {personal.phone && (
                            <View style={styles.contactItem}>
                                <Icon path={Paths.Phone} />
                                <Text style={styles.contactText}>{personal.phone}</Text>
                            </View>
                        )}
                        {location && (
                            <View style={styles.contactItem}>
                                <Icon path={Paths.Pin} />
                                <Text style={styles.contactText}>{location}</Text>
                            </View>
                        )}
                        {personal.github && (
                            <View style={styles.contactItem}>
                                <Icon path={Paths.Github} />
                                <Link src={personal.github} style={styles.contactText}>{personal.github.replace(/^https?:\/\//, '')}</Link>
                            </View>
                        )}
                        {personal.linkedin && (
                            <View style={styles.contactItem}>
                                <Icon path={Paths.Linkedin} />
                                <Link src={personal.linkedin} style={styles.contactText}>{personal.linkedin.replace(/^https?:\/\//, '')}</Link>
                            </View>
                        )}
                    </View>

                    {/* Skills na Sidebar */}
                    {skillsList.length > 0 && (
                        <View style={styles.sidebarSection}>
                            <Text style={styles.sidebarTitle}>Competências</Text>
                            <View style={styles.sidebarDivider} />
                            <View style={styles.skillContainer}>
                                {skillsList.map((skill, i) => (
                                    <Text key={i} style={styles.skillTag}>{skill}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* MAIN CONTENT */}
                <View style={styles.rightColumn}>

                    {/* Formação */}
                    {educationItems.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>Formação</Text>
                            {educationItems.map((item) => (
                                <View key={item.id} style={styles.itemBlock}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        <Text style={styles.itemDate}>{cleanDate(item.date)}</Text>
                                    </View>
                                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                                    {item.description && <FormattedText text={item.description} />}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Experiência */}
                    {experienceItems.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>Experiência</Text>
                            {experienceItems.map((item) => (
                                <View key={item.id} style={styles.itemBlock}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        <Text style={styles.itemDate}>{cleanDate(item.date)}</Text>
                                    </View>
                                    {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                                    <FormattedText text={item.description} />
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Cursos */}
                    {coursesItems.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>Cursos</Text>
                            {coursesItems.map((item) => (
                                <View key={item.id} style={styles.itemBlock}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        {item.date && <Text style={styles.itemDate}>{cleanDate(item.date)}</Text>}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Resumo (se houver) */}
                    {summary && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>Resumo Profissional</Text>
                            <FormattedText text={summary} />
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};

export default ResumeDocument;
