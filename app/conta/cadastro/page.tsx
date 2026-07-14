"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone";
import { cadastroSchema, type CadastroInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroInput>({ resolver: zodResolver(cadastroSchema) });

  async function onSubmit(values: CadastroInput) {
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.senha,
      options: {
        data: {
          nome: values.nome,
          telefone: normalizePhone(values.telefone),
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error("Não foi possível concluir o cadastro", {
        description: error.message,
      });
      return;
    }

    if (data.session) {
      toast.success("Cadastro realizado com sucesso!");
      router.push("/");
      router.refresh();
      return;
    }

    toast.success("Cadastro realizado!", {
      description: "Verifique seu e-mail para confirmar a conta.",
    });
    router.push("/conta/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>
            Cadastre-se para comprar e acompanhar seus pedidos.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.nome}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                type="tel"
                inputMode="tel"
                placeholder="(31) 99999-9999"
                autoComplete="tel"
                aria-invalid={!!errors.telefone}
                {...register("telefone")}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.senha}
                {...register("senha")}
              />
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 !pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/conta/login" className="text-primary underline underline-offset-4">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
