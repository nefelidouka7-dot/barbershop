import { Spinner } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
