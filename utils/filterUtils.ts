// Initial state for filters
export interface FiltersState {
    searchTerm: string;
    activeCategory: string;
}

export const FILTERS_INITIAL_STATE: FiltersState = {
    searchTerm: '',
    activeCategory: ''
};

/**
 * Clears query params from URL using setSearchParams
 */
export const clearQueryParams = (setSearchParams: (params: Record<string, string>) => void) => {
    setSearchParams({});
};
