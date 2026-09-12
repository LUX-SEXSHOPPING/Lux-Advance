# LUX — Login de Usuários e Modelos

Esta versão mantém os arquivos existentes e acrescenta a estrutura de autenticação.

## Arquivos novos
- login.html
- cadastro-usuario.html
- cadastro-modelo.html
- usuario/painel.html
- modelo/painel.html
- admin/painel.html
- js/config.js
- js/auth.js
- css/login.css
- SUPABASE.sql

## Configuração
1. Crie um projeto no Supabase.
2. Execute o conteúdo de SUPABASE.sql no SQL Editor.
3. Em Authentication > URL Configuration, coloque a URL do GitHub Pages.
4. Abra js/config.js e coloque a Project URL e a chave anon/public.
5. Nunca coloque a chave service_role no site.
6. Publique os arquivos no repositório GitHub Pages.

Observação: o login real depende do Supabase; apenas HTML/JavaScript no GitHub Pages não é suficiente para armazenar senhas com segurança.
