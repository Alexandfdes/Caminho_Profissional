export type CVAutofillConfidence = {
  personal: number;
  summary: number;
  skills: number;
  experience: number;
  education: number;
  courses: number;
  projects: number;
};

export type CVAutofillPatch = {
  personal: {
    fullName: string;
    role: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    birthDate: string;
    website: string;
    // Novos campos granulares
    firstName?: string;
    lastName?: string;
    useRoleAsTitle?: boolean;
    address?: string;
    zipCode?: string;
    city?: string;
    driversLicense?: string;
    nationality?: string;
    gender?: string;
    civilStatus?: string;
  };
  summaryHtml: string;
  skills: string[];
  experience: Array<{ title: string; subtitle: string; date: string; descriptionHtml: string }>;
  education: Array<{ title: string; subtitle: string; date: string; descriptionHtml: string }>;
  courses: Array<{ title: string; provider: string; date: string }>;
  projects: Array<{ title: string; url: string; date: string; descriptionHtml: string; tech: string[] }>;
};

export type CVAutofillResult = {
  ok: boolean;
  applyMode: 'replace';
  patch: CVAutofillPatch;
  confidence: CVAutofillConfidence;
  warnings: string[];
};
