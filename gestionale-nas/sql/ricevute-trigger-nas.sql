-- NAS PostgreSQL: equivalenti dei quattro trigger Supabase per le ricevute.
-- ESEGUIRE SOLO DOPO BACKUP, VERIFICA SCHEMA E CONFERMA ESPLICITA.
-- Su NAS l'autorizzazione avviene nell'API autenticata/CSRF, non tramite auth.uid().
-- Questo script non inserisce, aggiorna o cancella dati associativi.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.ricevute_progressivi (
  anno integer PRIMARY KEY,
  ultimo_numero integer NOT NULL CHECK (ultimo_numero > 0)
);
-- Non azzerare progressivi esistenti. Allinea a ricevute già presenti.
INSERT INTO private.ricevute_progressivi(anno,ultimo_numero)
SELECT anno, MAX(progressivo) FROM public.ricevute GROUP BY anno
ON CONFLICT (anno) DO UPDATE SET ultimo_numero=GREATEST(private.ricevute_progressivi.ultimo_numero,EXCLUDED.ultimo_numero);

CREATE OR REPLACE FUNCTION public.assegna_numero_ricevuta() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $fn$
DECLARE v_anno integer; v_progressivo integer;
BEGIN
  v_anno := extract(year from NEW.data_emissione)::integer;
  INSERT INTO private.ricevute_progressivi(anno,ultimo_numero) VALUES(v_anno,1)
  ON CONFLICT(anno) DO UPDATE SET ultimo_numero=private.ricevute_progressivi.ultimo_numero+1
  RETURNING ultimo_numero INTO v_progressivo;
  NEW.anno:=v_anno;
  NEW.progressivo:=v_progressivo;
  NEW.numero:=v_progressivo::text||'/'||v_anno::text;
  RETURN NEW;
END;
$fn$;
CREATE OR REPLACE FUNCTION public.blocca_modifica_numero_ricevuta() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $fn$
BEGIN
  IF NEW.anno<>OLD.anno OR NEW.progressivo<>OLD.progressivo OR NEW.numero<>OLD.numero
     OR NEW.pagamento_id<>OLD.pagamento_id OR NEW.socio_id<>OLD.socio_id THEN
    RAISE EXCEPTION 'Numero, anno, socio e pagamento della ricevuta non sono modificabili.';
  END IF;
  RETURN NEW;
END;
$fn$;
CREATE OR REPLACE FUNCTION public.collega_ricevuta_movimento() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $fn$
BEGIN
  UPDATE public.movimenti SET numero_documento=NEW.numero,tipo_documento='ricevuta'
  WHERE pagamento_id=NEW.pagamento_id;
  RETURN NEW;
END;
$fn$;
CREATE OR REPLACE FUNCTION public.impedisci_eliminazione_ricevuta() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $fn$
BEGIN
  RAISE EXCEPTION 'Le ricevute non si eliminano: usa lo stato annullata per conservare la numerazione.';
END;
$fn$;
DROP TRIGGER IF EXISTS ricevute_numero_progressivo ON public.ricevute;
CREATE TRIGGER ricevute_numero_progressivo BEFORE INSERT ON public.ricevute
FOR EACH ROW EXECUTE FUNCTION public.assegna_numero_ricevuta();
DROP TRIGGER IF EXISTS ricevute_numero_immutabile ON public.ricevute;
CREATE TRIGGER ricevute_numero_immutabile BEFORE UPDATE ON public.ricevute
FOR EACH ROW EXECUTE FUNCTION public.blocca_modifica_numero_ricevuta();
DROP TRIGGER IF EXISTS ricevute_collega_movimento ON public.ricevute;
CREATE TRIGGER ricevute_collega_movimento AFTER INSERT ON public.ricevute
FOR EACH ROW EXECUTE FUNCTION public.collega_ricevuta_movimento();
DROP TRIGGER IF EXISTS ricevute_no_delete ON public.ricevute;
CREATE TRIGGER ricevute_no_delete BEFORE DELETE ON public.ricevute
FOR EACH ROW EXECUTE FUNCTION public.impedisci_eliminazione_ricevuta();
COMMIT;
