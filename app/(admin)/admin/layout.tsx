"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles")
        .select("role").eq("id", user.id).maybeSingle();
      if (!p || !["admin","super_admin","finance_admin"].includes(p.role)) {
        router.push("/radar"); return;
      }
      setVerificado(true);
    };
    verificar();
  }, [router]);

  if (!verificado) return (
    <div style={{
      minHeight:"100vh", background:"#0a0d14",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:12
    }}>
      <div style={{
        width:32, height:32, borderRadius:"50%",
        border:"2px solid #8dc63f",
        borderTopColor:"transparent",
        animation:"spin 0.8s linear infinite"
      }}/>
      <span style={{
        fontFamily:"'Oswald',sans-serif", fontSize:11,
        color:"rgba(141,198,63,.5)", letterSpacing:3,
        textTransform:"uppercase"
      }}>Verificando acceso...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return <>{children}</>;
}