import { HeaderActionsProvider } from "@agent-native/toolkit/app-shell";
import { AgentSidebar } from "@agent-native/toolkit/app/chat";

import { APP_NAME } from "@/lib/app-config";
import { TAB_ID } from "@/lib/tab-id";
import { PostLaborShell } from "@/components/post-labor/shell";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <HeaderActionsProvider>
      <div className="dark pl-root flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        <AgentSidebar
          position="right"
          defaultOpen={false}
          storageKey={`${APP_NAME}-agent`}
          browserTabId={TAB_ID}
        >
          <main className="agent-native-app-main min-w-0 flex-1 overflow-y-auto overscroll-contain">
            <PostLaborShell>{children}</PostLaborShell>
          </main>
        </AgentSidebar>
      </div>
    </HeaderActionsProvider>
  );
}
