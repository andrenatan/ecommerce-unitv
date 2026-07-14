-- Entrega atômica de códigos ao aprovar um pedido.
-- FOR UPDATE SKIP LOCKED garante que pagamentos simultâneos nunca peguem o mesmo código.
CREATE OR REPLACE FUNCTION entregar_codigos_pedido(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_codigo_id UUID;
BEGIN
  -- Lock no pedido para evitar processamento duplicado
  PERFORM id FROM pedidos WHERE id = p_pedido_id FOR UPDATE;

  -- Atualizar status do pedido
  UPDATE pedidos
  SET status = 'aprovado', updated_at = NOW()
  WHERE id = p_pedido_id AND status = 'pendente';

  -- Para cada item do pedido, alocar N códigos disponíveis
  FOR v_item IN
    SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = p_pedido_id
  LOOP
    FOR i IN 1..v_item.quantidade LOOP
      -- Pegar o primeiro código disponível com SELECT FOR UPDATE SKIP LOCKED
      SELECT id INTO v_codigo_id
      FROM codigos
      WHERE produto_id = v_item.produto_id
        AND vendido = FALSE
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF v_codigo_id IS NULL THEN
        RAISE EXCEPTION 'Sem estoque disponível para produto %', v_item.produto_id;
      END IF;

      -- Marcar como vendido
      UPDATE codigos
      SET vendido = TRUE,
          vendido_em = NOW(),
          pedido_id = p_pedido_id
      WHERE id = v_codigo_id;
    END LOOP;
  END LOOP;
END;
$$;
