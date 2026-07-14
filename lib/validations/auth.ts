import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  senha: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroSchema = z.object({
  nome: z
    .string()
    .min(2, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  telefone: z
    .string()
    .min(10, "Informe um telefone válido com DDD")
    .max(20, "Telefone inválido"),
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  senha: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(72, "Senha muito longa"),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;
