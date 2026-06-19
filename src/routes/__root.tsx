import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { CrmProvider } from "@/lib/crm-store";
import { AppLayout } from "@/components/crm/AppLayout";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "THE VYROL CRM — Cold-calling command center" },
      { name: "description", content: "Modern cold-calling CRM for tracking daily calls, saving leads, and managing your sales pipeline." },
      { property: "og:title", content: "THE VYROL CRM — Cold-calling command center" },
      { property: "og:description", content: "Modern cold-calling CRM for tracking daily calls, saving leads, and managing your sales pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "THE VYROL CRM — Cold-calling command center" },
      { name: "twitter:description", content: "Modern cold-calling CRM for tracking daily calls, saving leads, and managing your sales pipeline." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef65e39b-e4f6-4ff3-a069-dc69052f656c/id-preview-e73f615f--2737f12f-189c-4ac7-bec6-db4804ddcdcf.lovable.app-1781860944108.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef65e39b-e4f6-4ff3-a069-dc69052f656c/id-preview-e73f615f--2737f12f-189c-4ac7-bec6-db4804ddcdcf.lovable.app-1781860944108.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold gradient-text">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <a href="/" className="mt-4 inline-block text-primary underline">Back to dashboard</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CrmProvider>
        <AppLayout>
          <Outlet />
        </AppLayout>
        <Toaster position="top-right" />
      </CrmProvider>
    </QueryClientProvider>
  );
}
