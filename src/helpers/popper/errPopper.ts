import { toast } from "sonner";
export const errPopper = (err: any) => {
  toast.dismiss();
  toast.error(err?.message || err?.data?.message || err?.response?.data?.errors?.[0]?.message || "Something went wrong");

  console.error(err);
};
