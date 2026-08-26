/**
 * Compatibility layer that exposes a small react-router-dom-like API
 * on top of TanStack Router, so pages copied from the SPA build keep working.
 */
import {
  Link as TanstackLink,
  useNavigate as useTanstackNavigate,
  useRouterState,
  useParams as useTanstackParams,
} from "@tanstack/react-router";
import { forwardRef, useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";

type To = string;

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  state?: unknown;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state: _state, ...rest },
  ref,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Anchor = TanstackLink as any;
  return <Anchor ref={ref} to={to} replace={replace} {...rest} />;
});

export interface NavLinkProps extends Omit<LinkProps, "className" | "children"> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  children?: ReactNode | ((props: { isActive: boolean; isPending: boolean }) => ReactNode);
  end?: boolean;
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, className, children, end, ...rest },
  ref,
) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      ref={ref}
      to={to}
      className={typeof className === "function" ? className({ isActive, isPending: false }) : className}
      {...rest}
    >
      {typeof children === "function" ? children({ isActive, isPending: false }) : children}
    </Link>
  );
});

export function useLocation() {
  return useRouterState({ select: (s) => s.location });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useParams<T = Record<string, any>>(): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useTanstackParams({ strict: false }) as any;
}

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return useCallback(
    (to: To | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to, replace: options?.replace } as any);
    },
    [navigate],
  );
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>, options?: { replace?: boolean }) => void] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useTanstackNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const params = useMemo(() => new URLSearchParams(searchStr ?? ""), [searchStr]);

  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>, options?: { replace?: boolean }) => {
      const usp = next instanceof URLSearchParams ? next : new URLSearchParams(next);
      const qs = usp.toString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: `${pathname}${qs ? `?${qs}` : ""}`, replace: options?.replace } as any);
    },
    [navigate, pathname],
  );

  return [params, setParams];
}
