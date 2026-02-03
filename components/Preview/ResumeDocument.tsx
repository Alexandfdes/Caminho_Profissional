import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link, Font, Svg, Path, Image } from '@react-pdf/renderer';
import { EditableCV, ResumeItem } from '../../types/cv';

// --- 1. CONFIGURAÇÃO DE FONTE ---
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontWeight: 400, fontStyle: 'italic' },
    ],
});

// --- 2. ÍCONES SVG MANUAIS ---
const Icon = ({ path, color = '#0f5156' }: { path: string; color?: string }) => (
    <Svg viewBox="0 0 24 24" width={9} height={9} style={{ marginRight: 6 }}>
        <Path fill={color} d={path} />
    </Svg>
);

const Paths = {
    Phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    Mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    Pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    Linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
    Globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79l5.79 5.79v1.93zm9.79-4.72c-.13-.47-.59-.71-1.07-.47-1.14.57-2.7.35-3.17-.4.15-.36.31-.73.45-1.1.28-.74.43-1.52.43-2.34 0-3.31-2.69-6-6-6-1.55 0-2.96.6-4.04 1.58.12-.01.24-.02.37-.02 2.21 0 4 1.79 4 4 0 .26-.03.52-.08.77l1.08 1.08c.55-.26 1.1-.51 1.65-.77.16-.07.31-.03.31.15 0 .25-.26.5-.5.75-.41.42-.98.71-1.56.88l1.04 1.03c.5-.15 1.01-.31 1.51-.46.33-.09.32.22.18.39-.75.89-1.66 1.56-2.73 1.93l.36.36c.92-.09 1.83-.24 2.76-.45.36-.08.64.21.5.54-.53 1.18-1.43 2.15-2.52 2.8.27.03.54.04.82.04 4.08 0 7.44-3.05 7.93-7z",
    Calendar: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z",
    Car: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
    User: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
};

// --- 3. ESTILOS ---
const colors = {
    accent: '#0f5156',
    darkText: '#000000',
    lightText: '#111111',
    bgSidebar: '#F8FAFC',
    divider: '#D1D5DB',
};

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Roboto',
        padding: 0,
    },
    leftColumn: {
        width: '32%',
        backgroundColor: colors.bgSidebar,
        minHeight: '100%',
        paddingBottom: 20,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    headerCurve: {
        backgroundColor: colors.accent,
        height: 140,
        borderBottomRightRadius: 60,
        padding: 20,
        justifyContent: 'center',
        marginBottom: 20,
    },
    name: {
        fontSize: 20,
        color: '#FFFFFF',
        fontFamily: 'Roboto',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 4,
        lineHeight: 1.1,
    },
    roleTitle: {
        fontSize: 12,
        color: '#E0E0E0',
        fontFamily: 'Roboto',
        fontWeight: 500,
    },
    sidebarSection: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    sidebarTitle: {
        fontSize: 12,
        color: colors.accent,
        fontFamily: 'Roboto',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    sidebarDivider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        paddingBottom: 3,
        marginBottom: 8,
    },
    contactList: {
        marginTop: 2,
    },
    contactItem: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'flex-start',
    },
    contactText: {
        fontSize: 10,
        color: colors.darkText,
        flex: 1,
        lineHeight: 1.3,
        textDecoration: 'none',
    },
    skillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
    },
    skillTag: {
        fontSize: 9.5,
        backgroundColor: '#E2E8F0',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 3,
        color: colors.darkText,
        marginBottom: 3,
        marginRight: 3,
    },
    rightColumn: {
        width: '68%',
        padding: 25,
        paddingTop: 30,
    },
    sectionMain: {
        marginBottom: 18,
    },
    sectionTitleMain: {
        fontSize: 16,
        color: colors.accent,
        fontFamily: 'Roboto',
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 3,
    },
    itemBlock: {
        marginBottom: 12,
    },
    itemHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: colors.darkText,
        maxWidth: '75%',
    },
    itemDate: {
        fontSize: 11,
        fontWeight: 500,
        color: colors.accent,
        textAlign: 'right',
    },
    itemSubtitle: {
        fontSize: 11,
        fontWeight: 700,
        color: colors.lightText,
        marginBottom: 3,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 10.5,
        lineHeight: 1.4,
        color: colors.lightText,
        textAlign: 'left',
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 15,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: colors.accent,
        objectFit: 'cover',
    },
});

// --- 4. HELPERS ---
const formatLink = (url?: string) => {
    if (!url) return '';
    let s = url.trim();
    s = s.replace(/^[:/]+ps:\/\//i, '');
    s = s.replace(/^https?:\/\//i, '');
    s = s.replace(/^www\./i, '');
    return s.replace(/\/$/, '');
};

const HtmlText = ({ html }: { html: string }) => {
    if (!html) return null;

    // 1. Limpeza inicial
    let clean = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ');

    // 2. Se não tiver tags HTML, retorna texto simples
    if (!/<[a-z][\s\S]*>/i.test(clean)) {
        const lines = clean.split('\n').filter(l => l.trim());
        return (
            <View>
                {lines.map((line, i) => (
                    <Text key={i} style={styles.description}>{line.trim()}</Text>
                ))}
            </View>
        );
    }

    // 3. Processamento de Listas (<ul>, <ol>, <li>)
    if (clean.includes('<li>') || clean.includes('<li ')) {
        const listItems = clean.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (listItems && listItems.length > 0) {
            return (
                <View>
                    {listItems.map((item, i) => {
                        const content = item
                            .replace(/<\/?li[^>]*>/gi, '')
                            .replace(/<[^>]+>/g, '')
                            .trim();
                        if (!content) return null;
                        return (
                            <Text key={i} style={styles.description}>• {content}</Text>
                        );
                    })}
                </View>
            );
        }
    }

    // 4. Processamento de Parágrafos (<p>)
    const paragraphs = clean
        .split(/<\/p>/i)
        .map(p => p.replace(/<p[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);

    if (paragraphs.length > 0) {
        return (
            <View>
                {paragraphs.map((text, i) => (
                    <Text key={i} style={[styles.description, { marginBottom: 2 }]}>{text}</Text>
                ))}
            </View>
        );
    }

    // 5. Fallback - remove todas as tags e retorna
    const fallbackText = clean.replace(/<[^>]+>/g, '').trim();
    return fallbackText ? <Text style={styles.description}>{fallbackText}</Text> : null;
};

// --- 5. COMPONENTE DOCUMENTO ---
export const ResumeDocument: React.FC<{ data: EditableCV }> = ({ data }) => {
    const sections = data.sections || [];
    const getSection = (id: string) => sections.find(s => s.id === id);

    const pessoais = getSection('personal');
    const summary = getSection('summary');
    const experience = getSection('experience');
    const education = getSection('education');
    const skills = getSection('skills');
    const courses = getSection('courses');
    const projects = getSection('projects');

    const fields = pessoais?.fields || {};
    const fullName = fields.fullName || `${fields.firstName || ''} ${fields.lastName || ''}`.trim();
    const role = fields.role || '';

    const cleanDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return String(dateStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/(\d)\s+(\d)/g, '$1$2').replace(/\s*\/\s*/g, '/');
    };

    return (
        <Document title={`${fullName || 'Curriculo'} - Profissional`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.leftColumn}>
                    {fields.photo && <Image src={fields.photo} style={styles.photo} />}
                    <View style={styles.headerCurve}>
                        <Text style={styles.name}>{fullName}</Text>
                        {role && <Text style={styles.roleTitle}>{role}</Text>}
                    </View>

                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>Dados Pessoais</Text>
                        <View style={styles.sidebarDivider} />
                        <View style={styles.contactList}>
                            {fields.phone && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Phone} />
                                    <Text style={styles.contactText}>{fields.phone}</Text>
                                </View>
                            )}
                            {fields.email && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Mail} />
                                    <Text style={styles.contactText}>{fields.email}</Text>
                                </View>
                            )}
                            {fields.address && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Pin} />
                                    <Text style={styles.contactText}>{fields.address}{fields.city ? `, ${fields.city}` : ''}</Text>
                                </View>
                            )}
                            {!fields.address && fields.city && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Pin} />
                                    <Text style={styles.contactText}>{fields.city}</Text>
                                </View>
                            )}
                            {fields.birthDate && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Calendar} />
                                    <Text style={styles.contactText}>{fields.birthDate}</Text>
                                </View>
                            )}
                            {fields.driversLicense && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Car} />
                                    <Text style={styles.contactText}>CNH: {fields.driversLicense}</Text>
                                </View>
                            )}
                            {(fields.nacionalidade || fields.civilStatus || fields.gender) && (
                                <View style={{ marginTop: 4, opacity: 0.8 }}>
                                    {[fields.nacionalidade, fields.civilStatus, fields.gender].filter(Boolean).map((t, i) => (
                                        <Text key={i} style={[styles.contactText, { fontSize: 7, marginBottom: 1 }]}>• {t}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>Redes & Links</Text>
                        <View style={styles.sidebarDivider} />
                        <View style={styles.contactList}>
                            {fields.linkedin && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Linkedin} />
                                    <Link src={fields.linkedin} style={styles.contactText}>
                                        <Text>{formatLink(fields.linkedin)}</Text>
                                    </Link>
                                </View>
                            )}
                            {fields.website && (
                                <View style={styles.contactItem}>
                                    <Icon path={Paths.Globe} />
                                    <Link src={fields.website} style={styles.contactText}>
                                        <Text>{formatLink(fields.website)}</Text>
                                    </Link>
                                </View>
                            )}
                        </View>
                    </View>

                    {skills?.visible && skills?.list?.length > 0 && (
                        <View style={styles.sidebarSection}>
                            <Text style={styles.sidebarTitle}>Habilidades</Text>
                            <View style={styles.sidebarDivider} />
                            <View style={styles.skillContainer}>
                                {skills.list.map((skill, i) => (
                                    <Text key={i} style={styles.skillTag}>{skill}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.rightColumn}>
                    {summary?.visible && summary?.content && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>{summary.title}</Text>
                            <HtmlText html={summary.content} />
                        </View>
                    )}

                    {experience?.visible && experience?.items?.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>{experience.title}</Text>
                            {experience.items.map((exp: ResumeItem) => (
                                <View key={exp.id} style={styles.itemBlock} wrap={false}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{exp.title}</Text>
                                        <Text style={styles.itemDate}>{cleanDate(exp.date)}</Text>
                                    </View>
                                    <Text style={styles.itemSubtitle}>{exp.subtitle}</Text>
                                    {exp.description && <HtmlText html={exp.description} />}
                                </View>
                            ))}
                        </View>
                    )}

                    {education?.visible && education?.items?.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>{education.title}</Text>
                            {education.items.map((edu: ResumeItem) => (
                                <View key={edu.id} style={styles.itemBlock}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemTitle}>{edu.title}</Text>
                                        <Text style={styles.itemDate}>{cleanDate(edu.date)}</Text>
                                    </View>
                                    <Text style={styles.itemSubtitle}>{edu.subtitle}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {projects?.visible && projects?.items?.length > 0 && (
                        <View style={styles.sectionMain}>
                            <Text style={styles.sectionTitleMain}>{projects.title}</Text>
                            {projects.items.map((proj: ResumeItem) => (
                                <View key={proj.id} style={styles.itemBlock}>
                                    <Text style={styles.itemTitle}>{proj.title}</Text>
                                    <View style={{ marginTop: 3 }}>
                                        {proj.description && <HtmlText html={proj.description} />}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};
