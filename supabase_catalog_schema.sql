-- Create catalog_items table
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('course', 'book', 'tool', 'mentorship', 'event')),
    category TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    price TEXT,
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can view catalog items
CREATE POLICY "Everyone can view catalog items" ON public.catalog_items
    FOR SELECT USING (true);

-- Only admins can insert/update/delete (assuming admin role check or service role)
-- For now, we'll allow authenticated users to read, and service role to write.
-- If you have an admin role system, you can add:
-- CREATE POLICY "Admins can manage catalog" ON public.catalog_items
--     FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Seed Data
INSERT INTO public.catalog_items (title, description, type, category, image_url, link_url, price, tags, featured) VALUES
('Fundamentos de Desenvolvimento Web', 'Aprenda HTML, CSS e JavaScript do zero.', 'course', 'Programação', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', '#', 'Grátis', ARRAY['frontend', 'web', 'iniciante'], true),
('Introdução a Data Science com Python', 'Domine a análise de dados com Python.', 'course', 'Dados', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', '#', 'R$ 29,90', ARRAY['python', 'dados', 'iniciante'], true),
('UX/UI Design: Do Zero ao Protótipo', 'Crie interfaces incríveis.', 'course', 'Design', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80', '#', 'R$ 49,90', ARRAY['design', 'ux', 'ui'], true),
('Marketing Digital e Growth Hacking', 'Estratégias de crescimento acelerado.', 'course', 'Marketing', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', '#', 'R$ 39,90', ARRAY['marketing', 'growth'], false),
('Clean Code (Código Limpo) — Robert C. Martin', 'O guia clássico para escrever código limpo.', 'book', 'Programação', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80', 'https://www.amazon.com.br/dp/8576082675', 'R$ 89,90', ARRAY['livro', 'boas-praticas', 'clean code'], true),
('Design de O dia a dia', 'Entenda como as coisas funcionam.', 'book', 'Design', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', '#', 'R$ 65,00', ARRAY['livro', 'design'], false),
('VS Code', 'O editor de código mais popular.', 'tool', 'Programação', 'https://images.unsplash.com/photo-1610433572201-110753c6cff9?auto=format&fit=crop&w=800&q=80', 'https://code.visualstudio.com/', 'Grátis', ARRAY['ferramenta', 'editor'], true),
('Figma', 'A ferramenta colaborativa de design de interface.', 'tool', 'Design', 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', 'https://www.figma.com/', 'Freemium', ARRAY['ferramenta', 'design'], true),
('Mentoria de Carreira Tech', 'Converse com experts do mercado.', 'mentorship', 'Carreira', 'https://images.unsplash.com/photo-1515168816178-1e7cd18bbc90?auto=format&fit=crop&w=800&q=80', '#', 'R$ 150,00', ARRAY['mentoria', 'carreira'], true);
