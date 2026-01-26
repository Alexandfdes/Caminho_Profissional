import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CareerPlan, TopCareer } from '../types';

// Register fonts if needed, or use standard fonts
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#0d9488', // teal-600
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a', // slate-900
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b', // slate-500
    },
    section: {
        margin: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0d9488', // teal-600
        marginBottom: 10,
    },
    text: {
        fontSize: 12,
        marginBottom: 5,
        lineHeight: 1.5,
        color: '#334155', // slate-700
    },
    stepContainer: {
        marginBottom: 15,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#cbd5e1', // slate-300
    },
    stepTimeframe: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a', // slate-900
        marginBottom: 5,
    },
    bulletPoint: {
        fontSize: 12,
        marginBottom: 3,
        color: '#334155', // slate-700
        marginLeft: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#94a3b8', // slate-400
        fontSize: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
});

interface CareerPlanPDFProps {
    career: TopCareer;
    plan: CareerPlan;
}

export const CareerPlanPDF: React.FC<CareerPlanPDFProps> = ({ career, plan }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Plano de Ação: {career.profession}</Text>
                <Text style={styles.subtitle}>O Caminho Profissional - Relatório Personalizado</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sua Missão</Text>
                <Text style={styles.text}>{career.description}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Especialização Recomendada</Text>
                <Text style={styles.text}>{career.specialization}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seu Caminho Detalhado</Text>
                {plan.stepByStepPlan.map((step, index) => (
                    <View key={index} style={styles.stepContainer}>
                        <Text style={styles.stepTimeframe}>{step.timeframe}</Text>
                        {step.actions.map((action, actionIndex) => (
                            <Text key={actionIndex} style={styles.bulletPoint}>• {action}</Text>
                        ))}
                    </View>
                ))}
            </View>

            <Text style={styles.footer}>
                Gerado por O Caminho Profissional - Inteligência Artificial de Carreira
            </Text>
        </Page>
    </Document>
);
