export type CatalogType = 'course' | 'book' | 'tool' | 'mentorship' | 'event';

export interface CatalogItem {
    id: string;
    title: string;
    description: string | null;
    type: CatalogType;
    category: string;
    image_url: string | null;
    link_url: string | null;
    price: string | null;
    tags: string[] | null;
    featured: boolean;
    created_at: string;
}

export interface CatalogFilter {
    type?: CatalogType | 'all';
    category?: string | 'all';
    search?: string;
}
