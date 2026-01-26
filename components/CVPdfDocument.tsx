import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { EditableCV } from '../types/cv';

// Define colors based on the site theme (Teal/Slate)
const colors = {
  primary: '#0d9488', // teal-600
  secondary: '#0f172a', // slate-900
  text: '#334155', // slate-700
  textLight: '#64748b', // slate-500
  white: '#ffffff',
  bgLight: '#f8fafc', // slate-50
  border: '#e2e8f0', // slate-200
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    padding: 0, // Full bleed for header
  },
  header: {
    backgroundColor: colors.secondary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  role: {
    fontSize: 12,
    color: '#2dd4bf', // teal-400
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  contactItem: {
    fontSize: 8,
    color: '#cbd5e1', // slate-300
    marginBottom: 2,
    fontFamily: 'Helvetica',
  },
  main: {
    padding: 20,
    flexDirection: 'row',
  },
  leftColumn: {
    width: '65%',
    paddingRight: 15,
  },
  rightColumn: {
    width: '35%',
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  expRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  expCompany: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expPeriod: {
    fontSize: 9,
    color: colors.textLight,
    backgroundColor: colors.bgLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expDesc: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.text,
    marginTop: 4,
  },
  educationItem: {
    marginBottom: 10,
  },
  eduDegree: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  eduInstitution: {
    fontSize: 10,
    color: colors.text,
  },
  eduPeriod: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 1,
  },
  skillItem: {
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.bgLight,
    padding: 6,
    marginBottom: 6,
    borderRadius: 4,
  },
});

interface CVPdfDocumentProps {
  data: EditableCV;
}

export const CVPdfDocument: React.FC<CVPdfDocumentProps> = ({ data }) => {
  const personalSection = data.sections.find(s => s.id === 'personal');
  const summarySection = data.sections.find(s => s.id === 'summary');
  const experienceSection = data.sections.find(s => s.id === 'experience');
  const educationSection = data.sections.find(s => s.id === 'education');
  const skillsSection = data.sections.find(s => s.id === 'skills');

  const personal = personalSection?.fields || {};
  const summary = summarySection?.content || '';
  const experience = experienceSection?.items || [];
  const education = educationSection?.items || [];
  const skills = skillsSection?.list || [];

  // Helper to get the latest role for the header
  const currentRole = personal.role || experience[0]?.title || 'Profissional';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Dark Theme */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{personal.fullName || 'Seu Nome'}</Text>
            <Text style={styles.role}>{currentRole}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.contactItem}>{personal.email || 'seu.email@exemplo.com'}</Text>
            <Text style={styles.contactItem}>{personal.phone || '(00) 00000-0000'}</Text>
            <Text style={styles.contactItem}>{personal.location || 'Cidade, Estado'}</Text>
            <Text style={styles.contactItem}>{personal.linkedin || 'linkedin.com/in/seu-perfil'}</Text>
          </View>
        </View>

        <View style={styles.main}>
          {/* Main Content (Left) */}
          <View style={styles.leftColumn}>
            {/* Summary */}
            {summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumo Profissional</Text>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experiência</Text>
                {experience.map((exp, i) => (
                  <View key={i} style={styles.experienceItem}>
                    <View style={styles.expHeader}>
                      <Text style={styles.expRole}>{exp.title}</Text>
                      <Text style={styles.expPeriod}>{exp.date}</Text>
                    </View>
                    <Text style={styles.expCompany}>{exp.subtitle}</Text>
                    <Text style={styles.expDesc}>{exp.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Sidebar (Right) */}
          <View style={styles.rightColumn}>
            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Educação</Text>
                {education.map((edu, i) => (
                  <View key={i} style={styles.educationItem}>
                    <Text style={styles.eduDegree}>{edu.subtitle}</Text>
                    <Text style={styles.eduInstitution}>{edu.title}</Text>
                    <Text style={styles.eduPeriod}>{edu.date}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Habilidades</Text>
                {skills.map((skill, i) => (
                  skill.trim() ? <Text key={i} style={styles.skillItem}>{skill}</Text> : null
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};
