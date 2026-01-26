import { supabaseService } from './supabaseService';

export type UserRole = 'user' | 'admin' | 'subscriber' | 'subscriber_basic';

export interface UserRoleData {
    userId: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export const roleService = {
    /**
     * PAYWALL DESLIGADO (por enquanto).
     * Quando você for reintroduzir planos/pagamento, mude para true e reative a lógica de roles.
     */
    PAYWALL_ENABLED: false,
    /**
     * Cache de roles para evitar requisições repetidas
     */
    roleCache: new Map<string, UserRole>(),

    /**
     * Limpa o cache de roles (útil no logout)
     */
    clearCache: () => {
        roleService.roleCache.clear();
    },

    /**
     * Verifica se o usuário logado é admin
     */
    isAdmin: async (): Promise<boolean> => {
        try {
            const user = await supabaseService.getUser();
            if (!user) return false;

            const role = await roleService.getUserRole(user.id);
            const isAdmin = role === 'admin';
            console.log(`[roleService] isAdmin check for ${user.email}:`, { dbRole: role, finalResult: isAdmin });
            return isAdmin;
        } catch (error) {
            console.error('Erro ao verificar role de admin:', error);
            return false;
        }
    },

    /**
     * Obtém a role do usuário (com cache)
     */
    getUserRole: async (userId: string): Promise<UserRole> => {
        // Check cache first
        if (roleService.roleCache.has(userId)) {
            return roleService.roleCache.get(userId)!;
        }

        const client = supabaseService.getClient();
        if (!client) return 'user';

        try {
            const { data, error } = await client
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            let role: UserRole = 'user';
            if (!error && data) {
                role = data.role as UserRole;
            }

            // Save to cache
            roleService.roleCache.set(userId, role);
            return role;
        } catch (error) {
            console.error('Erro ao buscar role:', error);
            return 'user';
        }
    },

    /**
     * Define a role de um usuário (apenas para admins)
     */
    setUserRole: async (userId: string, role: UserRole): Promise<void> => {
        const client = supabaseService.getClient();
        if (!client) throw new Error('Supabase não inicializado');

        // Verificar se quem está chamando é admin
        const isCurrentUserAdmin = await roleService.isAdmin();
        if (!isCurrentUserAdmin) {
            throw new Error('Apenas administradores podem alterar roles');
        }

        const { error } = await client
            .from('user_roles')
            .upsert({
                user_id: userId,
                role: role,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;

        // Update cache
        roleService.roleCache.set(userId, role);
    },

    /**
     * Verifica se o usuário tem uma assinatura ativa (BÁSICA OU PREMIUM)
     */
    isSubscriber: async (): Promise<boolean> => {
        try {
            const user = await supabaseService.getUser();
            if (!user) return false;

            // No momento, todos os usuários logados têm acesso a tudo.
            if (!roleService.PAYWALL_ENABLED) return true;

            const role = await roleService.getUserRole(user.id);
            return role === 'admin' || role === 'subscriber' || role === 'subscriber_basic';
        } catch (error) {
            console.error('Erro ao verificar subscriber:', error);
            return false;
        }
    },

    /**
     * Verifica se o usuário tem ACESSO TOTAL (Análise de CV, etc)
     * Retorna TRUE apenas para 'subscriber' (premium) e 'admin'.
     * Retorna FALSE para 'subscriber_basic'.
     */
    hasFullAccess: async (): Promise<boolean> => {
        try {
            const user = await supabaseService.getUser();
            if (!user) return false;

            // No momento, todos os usuários logados têm acesso a tudo.
            if (!roleService.PAYWALL_ENABLED) return true;

            const role = await roleService.getUserRole(user.id);
            return role === 'admin' || role === 'subscriber';
        } catch (error) {
            console.error('Erro ao verificar full access:', error);
            return false;
        }
    },

    // NOTE: no hardcoded admin/subscriber allowlists.
};
