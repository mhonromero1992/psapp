import { useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { DEMO_MEMBER, useSession } from "@/store/session";

/**
 * Guards the Member App. Prototype convenience: ?as=member signs in the sample member
 * directly (for demo links and automated UI tests).
 */
export function RequireMember({ children }: { children: React.ReactNode }) {
  const user = useSession((s) => s.user);
  const signIn = useSession((s) => s.signIn);
  const [params] = useSearchParams();
  const location = useLocation();
  const as = params.get("as");

  useEffect(() => {
    if (as === "member" && !user) {
      const { mobile: _m, pin: _p, ...u } = DEMO_MEMBER;
      signIn(u);
    }
  }, [as, user, signIn]);

  if (user) return <>{children}</>;
  if (as === "member") return null;
  return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
