import { Suspense } from "react";

import { AuthPage } from "@/components/testflow/auth-pages";

export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="signup" />
    </Suspense>
  );
}
