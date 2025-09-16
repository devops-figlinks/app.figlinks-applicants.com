import { IRedirectingDialog } from "@/lib/interfaces/meeting";
import { FC } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

const RedirectingDialog: FC<IRedirectingDialog> = ({ openOrNot }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (openOrNot) {
      setIsAnimating(true);
    }
  }, [openOrNot]);

  return (
      <Dialog open={openOrNot}>
        <DialogContent className="rounded-2xl p-12 sm:p-8 [&>button]:focus:ring-0 [&>button]:focus:outline-0 [&>button]:focus-visible:outline-0 [&>button]:focus:ring-offset-0">
          <h5 className="text-[clamp(18px,2vw,30px)] font-medium text-black mb-4">
            You&apos;ve finished the interview !
          </h5>
          <div className="flex items-center justify-start gap-8">
            <p className="text-sm font-medium text-black">Redirecting....</p>
            <svg width="30" height="30" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e6e6e6"
                stroke-width="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#89DDBB"
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray="282.6"
                stroke-dashoffset={isAnimating ? 0 : 282.6}
                transform="rotate(-90 50 50)"
              >
                <animate
                attributeName="stroke-dashoffset"
                from="282.6"
                to="0"
                dur="2s"
                fill="freeze"
              />
            </circle>
            </svg>
          </div>
        </DialogContent>
      </Dialog>
  );
};

export default RedirectingDialog;
