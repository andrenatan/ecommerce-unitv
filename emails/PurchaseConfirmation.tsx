import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type PurchaseConfirmationItem = {
  nome: string;
  quantidade: number;
  precoUnit: number;
  codigos: string[];
};

export type PurchaseConfirmationProps = {
  nomeCliente: string;
  itens: PurchaseConfirmationItem[];
  total: number;
  obrigadoUrl: string;
};

const COLORS = {
  background: '#0A0A0F',
  card: '#13131A',
  border: 'rgba(255,255,255,0.1)',
  primary: '#6C3DE8',
  secondary: '#00D4FF',
  text: '#F0F0F5',
  muted: '#9A9AAD',
  success: '#00C853',
};

export function PurchaseConfirmation({
  nomeCliente,
  itens,
  total,
  obrigadoUrl,
}: PurchaseConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu código de ativação chegou — pronto para usar agora!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.logo}>
            Uni<span style={{ color: COLORS.primary }}>TV</span>{' '}
            <span style={{ color: COLORS.secondary }}>Codes</span>
          </Text>

          <Heading style={styles.heading}>Pagamento confirmado! 🎉</Heading>
          <Text style={styles.paragraph}>
            Olá, {nomeCliente}! Recebemos a confirmação do seu pagamento e seu(s)
            código(s) de ativação já estão prontos para uso.
          </Text>

          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo do pedido</Text>
            {itens.map((item) => (
              <div key={item.nome} style={styles.resumoLinha}>
                <Text style={styles.resumoTexto}>
                  {item.quantidade}× {item.nome}
                </Text>
                <Text style={styles.resumoValor}>
                  R$ {(item.precoUnit * item.quantidade).toFixed(2)}
                </Text>
              </div>
            ))}
            <Hr style={styles.hr} />
            <div style={styles.resumoLinha}>
              <Text style={styles.resumoTotalTexto}>Total pago</Text>
              <Text style={styles.resumoTotalValor}>R$ {total.toFixed(2)}</Text>
            </div>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Seus códigos de ativação</Text>
            {itens.map((item) => (
              <div key={item.nome} style={{ marginBottom: '16px' }}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                {item.codigos.map((codigo) => (
                  <div key={codigo} style={styles.codigoBox}>
                    {codigo}
                  </div>
                ))}
              </div>
            ))}
          </Section>

          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Como ativar</Text>
            <Text style={styles.paragraph}>
              1. Abra o aplicativo no seu dispositivo.
              <br />
              2. Acesse o menu de Configurações → Ativação.
              <br />
              3. Insira o código acima e confirme.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href={obrigadoUrl} style={styles.button}>
              Ver pedido online
            </Link>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Precisa de ajuda? Responda este e-mail ou fale com nosso suporte.
            <br />
            UniTV Codes — códigos de ativação digitais.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PurchaseConfirmation;

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: COLORS.background,
    fontFamily:
      '"Segoe UI", Helvetica, Arial, sans-serif',
    padding: '24px 0',
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    padding: '32px',
    maxWidth: '480px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    color: COLORS.text,
    margin: '0 0 24px',
  },
  heading: {
    color: COLORS.text,
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 12px',
  },
  paragraph: {
    color: COLORS.muted,
    fontSize: '14px',
    lineHeight: '22px',
  },
  section: {
    marginTop: '24px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px',
  },
  resumoLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoTexto: {
    color: COLORS.text,
    fontSize: '14px',
    margin: '4px 0',
  },
  resumoValor: {
    color: COLORS.muted,
    fontSize: '14px',
    margin: '4px 0',
  },
  resumoTotalTexto: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: 700,
    margin: '4px 0',
  },
  resumoTotalValor: {
    color: COLORS.secondary,
    fontSize: '15px',
    fontWeight: 700,
    margin: '4px 0',
  },
  itemNome: {
    color: COLORS.muted,
    fontSize: '13px',
    margin: '0 0 6px',
  },
  codigoBox: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: COLORS.secondary,
    backgroundColor: 'rgba(0,212,255,0.08)',
    border: `1px solid rgba(0,212,255,0.4)`,
    borderRadius: '8px',
    padding: '12px 16px',
    textAlign: 'center',
    marginBottom: '8px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: COLORS.primary,
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 700,
    padding: '12px 24px',
    borderRadius: '10px',
    textDecoration: 'none',
  },
  hr: {
    borderColor: COLORS.border,
    margin: '16px 0',
  },
  footer: {
    color: COLORS.muted,
    fontSize: '12px',
    lineHeight: '18px',
    textAlign: 'center',
    marginTop: '24px',
  },
};
