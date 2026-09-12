# LUX Advance — Mercado Pago + planos

A implementação usa Supabase Edge Functions para manter o Access Token fora do frontend. O fluxo é: modelo autenticado → criar assinatura mensal → Mercado Pago → webhook → confirmação → atualização de `modelo_perfis` → selo público.

## 1. Supabase
Execute `SUPABASE.sql` no SQL Editor.

## 2. Secrets das Edge Functions
Configure no Supabase: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e `SITE_URL` (ex.: https://lux-sexshopping.github.io/lux-site). A chave secreta do webhook é a gerada em Mercado Pago > Sua integração > Webhooks.

As funções usam as variáveis padrão atuais do Supabase `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_SECRET_KEYS`, que já aparecem como Default secrets no painel. **Não crie `SUPABASE_SERVICE_ROLE_KEY` manualmente.**

## 3. Deploy
Use Supabase CLI ou o painel para publicar `supabase/functions/criar-assinatura` e `supabase/functions/mercadopago-webhook`.

## 4. Webhook
URL: `https://SEU-PROJETO.supabase.co/functions/v1/mercadopago-webhook`
Ative pelo menos o evento `payments`; para assinaturas, também habilite `subscription_preapproval` e `subscription_authorized_payment` quando aplicável.

## 5. Importante
O ZIP não contém e não deve conter o Access Token. Sem os Secrets e o webhook publicados, o botão de pagamento não consegue concluir a integração. O LUX-ESSENCE é ativado diretamente pelo Supabase.

## 5. Eventos obrigatórios do webhook

No Mercado Pago, configure o webhook para os eventos:
- `payments`
- `subscription_preapproval`
- `subscription_authorized_payment`

O endpoint agora trata cada evento pelo endpoint correspondente da API: pagamentos em `/v1/payments/{id}`, assinaturas em `/preapproval/{id}` e cobranças recorrentes em `/authorized_payments/{id}`. Isso mantém o plano e o selo sincronizados com o estado real da assinatura.

## 6. Regra dos selos

- LUX-ESSENCE → `ESSENCE`
- LUX-DESFIRE → `VERIFICADO`
- LUX-ELITE → `ELITE`
- LUX-ROYAL → `ROYAL`

Após aprovação/autorização, o selo é gravado em `modelo_perfis.selo_codigo` e as páginas públicas do LUX o exibem.

Se uma assinatura for pausada, o plano fica `pausado`. Se for cancelada ou o pagamento for rejeitado, o perfil retorna ao LUX-ESSENCE e o selo premium é removido. O Access Token e o segredo do webhook permanecem somente nos Secrets do Supabase.

## Segurança obrigatória desta versão

Cadastre somente estes Secrets personalizados nas Edge Functions do Supabase:

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `SITE_URL` = `https://lux-sexshopping.github.io/lux-site`

As chaves `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_SECRET_KEYS` são fornecidas automaticamente pelo Supabase como Default secrets. A chave secreta é usada apenas no backend e nunca deve ser colocada em HTML, JavaScript público ou GitHub Pages.

O webhook deve receber os tópicos de assinatura/pagamento necessários e validar a assinatura `x-signature` antes de processar qualquer benefício.
