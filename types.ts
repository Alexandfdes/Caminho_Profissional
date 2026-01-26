export interface Question {
  id: string;
  label: string;
  type: 'radio' | 'textarea';
  options?: string[];
  placeholder?: string;
}

export interface UserAnswers {
  [key: string]: string;
}

export interface CareerPlanStep {
  timeframe: string;
  actions: string[];
}

export interface CareerPlan {
  stepByStepPlan: CareerPlanStep[];
}

export interface TopCareer {
  profession: string;
  description: string;
  specialization: string;
  tools: string[];
  salaryRange: string;
  marketDemand: string;
}

export interface CareerDetails {
  title: string;
  category: string;
  description: string;
  dailyResponsibilities: string[];
  salaryRange: string;
  marketDemand: string;
  requiredSkills: string[];
}

export interface NextQuestionResponse {
  nextQuestion?: Question;
  isComplete: boolean;
}