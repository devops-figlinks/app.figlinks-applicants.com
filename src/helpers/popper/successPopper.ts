import { toast } from "sonner";

export const successPopper = (response: any) => {
  toast.dismiss();
  let message = response?.message || response?.data?.message || response || "";
  message && toast.success(message);
};
