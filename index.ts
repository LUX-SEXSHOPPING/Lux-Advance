import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLANOS: Record<string,{nome:string;valor:number;selo:string}> = {
  DESFIRE:{nome:"LUX-DESFIRE",valor:29.90,selo:"VERIFICADO"},
  ELITE:{nome:"LUX-ELITE",valor:59.90,selo:"ELITE"},
  ROYAL:{nome:"LUX-ROYAL",valor:99.90,selo:"ROYAL"}
};

const jsonHeaders={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:jsonHeaders});
  if(req.method!=="POST") return new Response(JSON.stringify({error:"Método não permitido"}),{status:405,headers:jsonHeaders});

  try{
    const auth=req.headers.get("Authorization");
    if(!auth) throw new Error("Sessão não encontrada.");

    // Cliente autenticado: usado somente para descobrir o usuário da sessão.
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const publishableKey = publishableKeys.default || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if(!publishableKey) throw new Error("Chave pública do Supabase não disponível.");

    const authClient=createClient(
      Deno.env.get("SUPABASE_URL")!,
      publishableKey,
      {global:{headers:{Authorization:auth}}}
    );
    const {data:{user},error:ue}=await authClient.auth.getUser();
    if(ue||!user) throw new Error("Faça login para continuar.");

    const {data:perfil,error:pe}=await authClient.from("perfis").select("id,tipo,nome").eq("id",user.id).single();
    if(pe||!perfil||perfil.tipo!=="modelo") throw new Error("Apenas contas de modelo podem contratar planos.");

    const {plano}=await req.json().catch(()=>({}));
    const p=PLANOS[plano];
    if(!p) throw new Error("Plano inválido.");

    const token=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if(!token) throw new Error("Mercado Pago ainda não foi configurado no servidor. Cadastre MERCADOPAGO_ACCESS_TOKEN nos Secrets da Edge Function.");

    // Cliente administrativo somente no servidor. Nunca exponha esta chave no site.
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!secretKey) throw new Error("Chave secreta do Supabase não disponível.");

    const admin=createClient(
      Deno.env.get("SUPABASE_URL")!,
      secretKey,
      {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
    );

    // Impede criar várias assinaturas simultâneas para o mesmo modelo.
    const {data:existente}=await admin
      .from("pagamentos_planos")
      .select("id,plano_codigo,status,mp_subscription_id")
      .eq("modelo_id",user.id)
      .in("status",["pending","approved","paused"])
      .order("created_at",{ascending:false})
      .limit(1)
      .maybeSingle();
    if(existente?.status==="approved" && existente.mp_subscription_id){
      throw new Error("Você já possui uma assinatura ativa. Cancele ou altere a assinatura atual antes de contratar outra.");
    }
    if(existente?.status==="pending" && existente.mp_subscription_id){
      throw new Error("Já existe uma assinatura aguardando pagamento. Finalize o pagamento antes de criar outra.");
    }

    const external=`LUX-${plano}-${user.id}-${crypto.randomUUID()}`;
    const {data:pagamento,error:ie}=await admin.from("pagamentos_planos").insert({
      modelo_id:user.id,
      plano_codigo:plano,
      valor:p.valor,
      moeda:"BRL",
      status:"pending",
      external_reference:external
    }).select("id").single();
    if(ie||!pagamento) throw ie || new Error("Não foi possível registrar a cobrança.");

    const site=(Deno.env.get("SITE_URL") || "https://lux-sexshopping.github.io/lux-site").replace(/\/$/,"");
    const mp=await fetch("https://api.mercadopago.com/preapproval",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({
        reason:p.nome,
        external_reference:external,
        payer_email:user.email,
        auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:p.valor,currency_id:"BRL"},
        back_url:`${site}/pagamento-retorno.html`,
        status:"pending"
      })
    });
    const data=await mp.json().catch(()=>({}));
    if(!mp.ok){
      await admin.from("pagamentos_planos").update({status:"rejected",updated_at:new Date().toISOString()}).eq("id",pagamento.id);
      throw new Error(data?.message||"Mercado Pago recusou a criação da assinatura.");
    }

    await admin.from("pagamentos_planos").update({
      mp_subscription_id:String(data.id),
      updated_at:new Date().toISOString()
    }).eq("id",pagamento.id);

    const initPoint=data.init_point || data.sandbox_init_point;
    if(!initPoint) throw new Error("O Mercado Pago criou a assinatura, mas não retornou o link de pagamento.");

    return new Response(JSON.stringify({init_point:initPoint,id:data.id}),{headers:jsonHeaders});
  }catch(e){
    console.error("LUX criar assinatura:",e);
    return new Response(JSON.stringify({error:e instanceof Error?e.message:"Erro interno"}),{status:400,headers:jsonHeaders});
  }
});
