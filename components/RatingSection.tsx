import React, { useState } from 'react';

interface RatingSectionProps {
    onRate?: (rating: number, feedback?: string) => void;
}

export const RatingSection: React.FC<RatingSectionProps> = ({ onRate }) => {
    const [rating, setRating] = useState<number | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleRatingClick = (value: number) => {
        setRating(value);
        if (value <= 3) {
            setShowFeedback(true);
        } else {
            setShowFeedback(false);
            handleSubmit(value);
        }
    };

    const handleSubmit = (ratingValue?: number, feedbackValue?: string) => {
        const finalRating = ratingValue || rating;
        const finalFeedback = feedbackValue || feedback;

        if (finalRating && onRate) {
            onRate(finalRating, finalFeedback);
        }
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="text-center py-6 animate-fade-in">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500/20 rounded-full mb-3">
                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-slate-300 font-medium">Obrigado pelo seu feedback! 🎉</p>
                <p className="text-slate-500 text-sm mt-1">Sua opinião nos ajuda a melhorar continuamente.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 animate-fade-in">
            <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    Como você avalia seu resultado? ⭐
                </h3>
                <p className="text-slate-400 text-sm">
                    Sua opinião sincera é importante para nós
                </p>
            </div>

            <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                    >
                        <svg
                            className={`w-10 h-10 transition-colors ${(hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-600 fill-slate-600'
                                }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                    </button>
                ))}
            </div>

            {showFeedback && (
                <div className="animate-fade-in">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="O que poderíamos melhorar? (Opcional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                        rows={3}
                    />
                    <button
                        onClick={() => handleSubmit(rating!, feedback)}
                        className="mt-2 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Enviar Feedback
                    </button>
                </div>
            )}
        </div>
    );
};
