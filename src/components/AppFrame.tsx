import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";

type AppFrameProps = {
  children: ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="app-frame">
      <AppHeader />
      {children}
    </div>
  );
}
