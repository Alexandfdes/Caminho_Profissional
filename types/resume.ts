export type ResumeContact = {
    phone: string;
    email: string;
    location: string;
    website: string;
};

export type ResumeExperience = {
    company: string;
    role: string;
    period: string;
    description: string;
};

export type ResumeEducation = {
    institution: string;
    degree: string;
    period: string;
};

export type ResumeData = {
    personalInfo: {
        name: string;
        role: string;
        photo?: string;
        contact: ResumeContact;
    };
    summary: string;
    experiences: ResumeExperience[];
    education: ResumeEducation[];
    skills: string[];
};
