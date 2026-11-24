import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { BladeWipeProvider } from "@/components/motion/BladeWipe";
import { ScrollManager } from "@/components/layout/ScrollManager";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { RequireMember } from "@/components/layout/RequirePortal";
import { LoadingRows } from "@/components/ui/States";
import { BladeMark } from "@/components/brand/BladeMark";
import { MemberMore, MemberShell } from "@/features/member/MemberShell";
import { AuthLayout } from "@/features/welcome/AuthLayout";

const Welcome = lazy(() => import("@/features/welcome/Welcome"));
const SignIn = lazy(() => import("@/features/auth/SignIn"));
const Verify = lazy(() => import("@/features/auth/Verify"));
const Enrol = lazy(() => import("@/features/enrol/Enrol"));
const NotFound = lazy(() => import("@/features/NotFound"));

const m = {
  Home: lazy(() => import("@/features/member/pages/Home")),
  Equity: lazy(() => import("@/features/member/pages/Equity")),
  Loans: lazy(() => import("@/features/member/pages/Loans")),
  LoanApply: lazy(() => import("@/features/member/pages/LoanApply")),
  LoanDetail: lazy(() => import("@/features/member/pages/LoanDetail")),
  Claims: lazy(() => import("@/features/member/pages/Claims")),
  ClaimNew: lazy(() => import("@/features/member/pages/ClaimNew")),
  ClaimDetail: lazy(() => import("@/features/member/pages/ClaimDetail")),
  Payouts: lazy(() => import("@/features/member/pages/Payouts")),
  Assist: lazy(() => import("@/features/member/pages/Assist")),
  Branches: lazy(() => import("@/features/member/pages/Branches")),
  Profile: lazy(() => import("@/features/member/pages/Profile")),
  Notifications: lazy(() => import("@/features/member/pages/Notifications")),
};

function Root() {
  return (
    <MotionConfig reducedMotion="user">
      <BladeWipeProvider>
        <ThemeSync />
        <ScrollManager />
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
        <Toaster
          position="top-center"
          offset={20}
          toastOptions={{
            duration: 5000,
            classNames: {
              toast: "!rounded-lg !bg-surface !text-ink !shadow-e3 !border-0 !font-sans !text-[1rem] !p-4",
              description: "!text-ink-2 !text-[0.9rem]",
              actionButton: "!bg-primary-strong !text-white !rounded-sm",
            },
          }}
        />
      </BladeWipeProvider>
    </MotionConfig>
  );
}

function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-live="polite">
      <BladeMark size={48} spin rim={false} />
      <span className="sr-only">Loading PS-ACCESS</span>
    </div>
  );
}

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="pt-6"><LoadingRows rows={5} label="Loading page" /></div>}>
      {children}
    </Suspense>
  );
}

const wrap = (el: React.ReactNode) => <PageSuspense>{el}</PageSuspense>;

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/", element: <Welcome /> },
          { path: "/sign-in", element: <SignIn /> },
          { path: "/sign-in/verify", element: <Verify /> },
        ],
      },
      { path: "/enrol", element: <Enrol /> },
      {
        path: "/member",
        element: (
          <RequireMember>
            <MemberShell />
          </RequireMember>
        ),
        children: [
          { index: true, element: wrap(<m.Home />) },
          { path: "equity", element: wrap(<m.Equity />) },
          { path: "loans", element: wrap(<m.Loans />) },
          { path: "loans/apply", element: wrap(<m.LoanApply />) },
          { path: "loans/:id", element: wrap(<m.LoanDetail />) },
          { path: "claims", element: wrap(<m.Claims />) },
          { path: "claims/new", element: wrap(<m.ClaimNew />) },
          { path: "claims/:id", element: wrap(<m.ClaimDetail />) },
          { path: "payouts", element: wrap(<m.Payouts />) },
          { path: "assist", element: wrap(<m.Assist />) },
          { path: "branches", element: wrap(<m.Branches />) },
          { path: "profile", element: wrap(<m.Profile />) },
          { path: "notifications", element: wrap(<m.Notifications />) },
          { path: "more", element: <MemberMore /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
