import { Spinner } from "@/components/ui/states";

export default function AdminLoading() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
