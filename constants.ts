
import { Question } from './types';

export const SEED_QUESTION: Question = {
  id: 'seed_question',
  label: 'Para começar, o que você diria que é a sua maior motivação hoje?',
  type: 'radio',
  options: [
    'Construir algo inovador e tecnológico',
    'Ajudar pessoas e causar impacto social',
    'Ganhar dinheiro e ter estabilidade financeira',
    'Expressar minha criatividade e arte',
  ],
};

// API Usage Monitoring Constants
export const API_LIMITS = {
  FREE_TIER_DAILY: 1500,
  FREE_TIER_PER_MINUTE: 15,
  WARNING_THRESHOLD: 0.8, // 80%
  CRITICAL_THRESHOLD: 0.95 // 95%
};

export const PRICING = {
  GEMINI_FLASH_INPUT: 0.075 / 1_000_000, // USD per token
  GEMINI_FLASH_OUTPUT: 0.30 / 1_000_000, // USD per token
  // Average tokens per request (estimates for cost calculation)
  AVG_TOKENS_QUESTION: 1500,
  AVG_TOKENS_CAREERS: 2500,
  AVG_TOKENS_PLAN: 3000,
  AVG_TOKENS_CV: 4000,
  AVG_TOKENS_CHAT: 1000,
  AVG_TOKENS_EXPLORE: 2000,
};
