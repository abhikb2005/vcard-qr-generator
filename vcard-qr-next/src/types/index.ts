export interface PSEOPage {
    slug: string;
    category: string;
    intent: 'informational' | 'transactional' | 'navigational';
    title: string;
    h1: string;
    description: string;
    keywords: string[];
    faqs: FAQ[];
    relatedSlugs: string[];
    parentSlug?: string;
    schema?: any;    // Flexible schema type
    lastModified: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface Hub {
    id: string;
    title: string;
    description: string;
}
