
DROP POLICY IF EXISTS "All authenticated can view call_logs" ON public.call_logs;
CREATE POLICY "Users view own call_logs" ON public.call_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.get_team_today_call_counts()
RETURNS TABLE(user_id uuid, email text, call_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.email, COUNT(c.id)
  FROM public.profiles p
  LEFT JOIN public.call_logs c
    ON c.user_id = p.id AND c.call_date >= date_trunc('day', now())
  WHERE auth.uid() IS NOT NULL
  GROUP BY p.id, p.email;
$$;

CREATE OR REPLACE FUNCTION public.get_team_alltime_call_counts()
RETURNS TABLE(user_id uuid, email text, call_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.email, COUNT(c.id)
  FROM public.profiles p
  LEFT JOIN public.call_logs c ON c.user_id = p.id
  WHERE auth.uid() IS NOT NULL
  GROUP BY p.id, p.email
  ORDER BY COUNT(c.id) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_today_call_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_alltime_call_counts() TO authenticated;
