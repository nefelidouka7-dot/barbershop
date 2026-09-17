import { Suspense } from "react";
import BookPage from "./book-client";
import { Spinner } from "@/components/ui/states";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <BookPage />
    </Suspense>
  );
}
