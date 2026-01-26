import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderBackButtonProps {
    fallbackRoute?: string;
    label?: string;
    className?: string;
}

/**
 * Header Back Button Component
 * Navigates back in history or to fallback route
 * Supports ESC key for accessibility
 */
export const HeaderBackButton: React.FC<HeaderBackButtonProps> = ({
    fallbackRoute = '/dashboard',
    label = 'Voltar',
    className = ''
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            // Navigate to fallback route if no history
            navigate(fallbackRoute);
        }
    };

    // Handle ESC key press
    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleBack();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <button
            onClick={handleBack}
            aria-label={label}
            className={`
        flex items-center gap-2
        text-slate-400 hover:text-white
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900
        rounded-lg p-2
        ${className}
      `}
        >
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m0 14H3m18 0V5"
                />
            </svg>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};
