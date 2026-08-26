
CREATE OR REPLACE FUNCTION public.get_credit_usage_summary(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_totals jsonb;
  v_daily jsonb;
  v_by_endpoint jsonb;
  v_by_model jsonb;
  v_by_key jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF p_days IS NULL OR p_days < 1 THEN p_days := 7; END IF;
  IF p_days > 90 THEN p_days := 90; END IF;
  v_start := now() - make_interval(days => p_days);

  SELECT jsonb_build_object(
    'requests', COUNT(*),
    'tokens', COALESCE(SUM(tokens_used),0),
    'errors', COUNT(*) FILTER (WHERE status_code >= 400 OR error_message IS NOT NULL),
    'avg_latency_ms', COALESCE(ROUND(AVG(response_time_ms))::int, 0)
  ) INTO v_totals
  FROM public.api_usage_logs
  WHERE created_at >= v_start;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb) INTO v_daily
  FROM (
    SELECT date_trunc('day', created_at)::date AS day,
           COUNT(*)::int AS requests,
           COALESCE(SUM(tokens_used),0)::int AS tokens,
           COUNT(*) FILTER (WHERE status_code >= 400 OR error_message IS NOT NULL)::int AS errors
    FROM public.api_usage_logs
    WHERE created_at >= v_start
    GROUP BY 1
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.requests DESC), '[]'::jsonb) INTO v_by_endpoint
  FROM (
    SELECT COALESCE(endpoint, 'unknown') AS endpoint,
           COUNT(*)::int AS requests,
           COALESCE(SUM(tokens_used),0)::int AS tokens
    FROM public.api_usage_logs
    WHERE created_at >= v_start
    GROUP BY 1
    LIMIT 20
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.tokens DESC), '[]'::jsonb) INTO v_by_model
  FROM (
    SELECT COALESCE(model_used, 'unknown') AS model,
           COUNT(*)::int AS requests,
           COALESCE(SUM(tokens_used),0)::int AS tokens
    FROM public.api_usage_logs
    WHERE created_at >= v_start
    GROUP BY 1
    LIMIT 20
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.requests DESC), '[]'::jsonb) INTO v_by_key
  FROM (
    SELECT l.api_key_id,
           COALESCE(k.name, '(no key)') AS key_name,
           COALESCE(k.email, '-') AS email,
           COALESCE(k.key_prefix, '-') AS key_prefix,
           COUNT(*)::int AS requests,
           COALESCE(SUM(l.tokens_used),0)::int AS tokens
    FROM public.api_usage_logs l
    LEFT JOIN public.api_keys k ON k.id = l.api_key_id
    WHERE l.created_at >= v_start
    GROUP BY l.api_key_id, k.name, k.email, k.key_prefix
    ORDER BY requests DESC
    LIMIT 20
  ) t;

  RETURN jsonb_build_object(
    'days', p_days,
    'start', v_start,
    'totals', v_totals,
    'daily', v_daily,
    'by_endpoint', v_by_endpoint,
    'by_model', v_by_model,
    'by_key', v_by_key
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_credit_usage_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_credit_usage_summary(integer) TO authenticated, service_role;
