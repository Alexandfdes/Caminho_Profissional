import { supabaseService } from './supabaseService';

const MP_STORAGE_KEYS = {
    LAST_PLAN_ID: 'mp_last_plan_id',
    LAST_PREFERENCE_ID: 'mp_last_preference_id',
    LAST_CHECKOUT_URL: 'mp_last_checkout_url',
    LAST_CREATED_AT: 'mp_last_created_at',
} as const;

export const paymentService = {
    /**
     * Creates a payment preference in Mercado Pago via Supabase Edge Function
     */
    createPreference: async (planId: string, title: string, price: number): Promise<string> => {
        const user = await supabaseService.getUser();

        if (!user) {
            throw new Error('Usuário não autenticado');
        }


        const { data, error } = await supabaseService.getClient().functions.invoke('create-preference', {
            body: {
                planId,
                title,
                price,
                userEmail: user.email,
                userId: user.id,
                baseUrl: window.location.origin
            }
        });

        if (error) {
            console.error('Erro ao criar preferência:', error);

            // Try to extract the real message returned by the function
            const anyError: any = error as any;
            try {
                const ctx = anyError?.context;
                if (ctx) {
                    const maybeJson = await ctx.json?.();
                    const msg = maybeJson?.error || maybeJson?.message;
                    if (msg) throw new Error(String(msg));

                    const maybeText = await ctx.text?.();
                    if (maybeText) throw new Error(String(maybeText));
                }
            } catch (e) {
                if (e instanceof Error) throw e;
            }

            throw new Error(anyError?.message || 'Falha ao iniciar pagamento');
        }

        if (data?.error) {
            throw new Error(String(data.error));
        }

        try {
            localStorage.setItem(MP_STORAGE_KEYS.LAST_PLAN_ID, planId);
            if (data.id) localStorage.setItem(MP_STORAGE_KEYS.LAST_PREFERENCE_ID, String(data.id));
            localStorage.setItem(MP_STORAGE_KEYS.LAST_CREATED_AT, String(Date.now()));
        } catch {
            // non-blocking
        }

        // Sempre usar init_point (produção)
        const preferredUrl = data?.init_point || data?.sandbox_init_point;

        console.log('[paymentService] Preference created:', {
            id: data.id,
            hasInitPoint: !!data.init_point,
            hasSandboxPoint: !!data.sandbox_init_point,
            preferredUrl
        });

        if (!preferredUrl) {
            throw new Error('Mercado Pago não retornou o link de checkout. Verifique os logs da Edge Function.');
        }

        try {
            localStorage.setItem(MP_STORAGE_KEYS.LAST_CHECKOUT_URL, String(preferredUrl));
        } catch {
            // non-blocking
        }

        return preferredUrl;
    }
};
