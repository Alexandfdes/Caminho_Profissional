import React, { useState, useEffect } from 'react';
import { addToFavorites, removeFromFavorites, isCareerFavorite } from '../services/supabaseService';

interface FavoriteButtonProps {
    careerId: string;
    careerTitle?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    careerId,
    careerTitle = '',
    size = 'md'
}) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkFavoriteStatus();
    }, [careerId]);

    const checkFavoriteStatus = async () => {
        try {
            const status = await isCareerFavorite(careerId);
            setIsFavorite(status);
        } catch (error) {
            console.error('Erro ao verificar favorito:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isLoading) return;

        setIsLoading(true);
        const previousState = isFavorite;

        // Optimistic UI update
        setIsFavorite(!isFavorite);

        try {
            if (isFavorite) {
                await removeFromFavorites(careerId);
            } else {
                await addToFavorites(careerId, { title: careerTitle });
            }
        } catch (error) {
            // Revert on error
            setIsFavorite(previousState);
            console.error('Erro ao atualizar favorito:', error);
            alert('Erro ao salvar. Você precisa estar logado.');
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    if (isChecking) {
        return (
            <div className={`${sizeClasses[size]} flex items-center justify-center`}>
                <div className="animate-pulse bg-slate-600 rounded-full w-full h-full"></div>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isFavorite
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <svg
                className={`${iconSizes[size]} transition-transform ${isLoading ? 'animate-pulse' : ''}`}
                fill={isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
};
