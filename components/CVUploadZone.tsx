import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface CVUploadZoneProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export const CVUploadZone: React.FC<CVUploadZoneProps> = ({ onFileSelect, isLoading }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError('Arquivo muito grande. Tamanho máximo: 5MB');
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError('Tipo de arquivo inválido. Use apenas PDF');
            } else {
                setError('Erro ao processar arquivo');
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: false,
        disabled: isLoading
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive
                        ? 'border-teal-400 bg-teal-500/10'
                        : error
                            ? 'border-red-400 bg-red-500/5'
                            : selectedFile
                                ? 'border-green-400 bg-green-500/5'
                                : 'border-slate-600 bg-slate-800/30 hover:border-teal-500 hover:bg-slate-800/50'
                    }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-12 w-12 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-slate-300 font-medium">Analisando seu currículo...</p>
                        </>
                    ) : selectedFile ? (
                        <>
                            <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-slate-200 font-medium">{selectedFile.name}</p>
                                <p className="text-slate-400 text-sm mt-1">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {isDragActive ? (
                                <p className="text-teal-300 font-medium text-lg">
                                    Solte o arquivo aqui...
                                </p>
                            ) : (
                                <div>
                                    <p className="text-slate-200 font-medium text-lg mb-2">
                                        Arraste seu currículo aqui
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        ou clique para selecionar
                                    </p>
                                    <p className="text-slate-500 text-xs mt-3">
                                        PDF • Máximo 5MB
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};
