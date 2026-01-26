// Type definitions for Deno environment in non-Deno editors

declare global {
    const Deno: {
        env: {
            get(key: string): string | undefined;
            toObject(): { [key: string]: string };
        };
        serve(handler: (req: Request) => Response | Promise<Response>): void;
    };
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
    export function serve(handler: (req: Request) => Response | Promise<Response>, options?: any): void;
}
