/**
 * Normaliza telefone para o formato exigido pelas automações n8n/WhatsApp:
 * DDI+DDD+número, apenas dígitos (ex: "5531999999999").
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}
