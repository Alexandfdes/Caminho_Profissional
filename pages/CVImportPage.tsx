import React from 'react';
import ResumeImport from '../components/ResumeImport';
import { HeaderBackButton } from '../components/HeaderBackButton';

export const CVImportPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center gap-4">
                    <HeaderBackButton />
                    <h1 className="text-2xl font-bold text-gray-900">Importar Currículo</h1>
                </div>
                <ResumeImport />
            </div>
        </div>
    );
};
