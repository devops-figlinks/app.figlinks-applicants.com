import { toast } from "sonner";
export const warningPopper = (err: any) => {
  toast.dismiss();
  toast.warning(
    err?.message || err?.data?.message || err || "Something went wrong"
  );

  console.warn(err);
};
