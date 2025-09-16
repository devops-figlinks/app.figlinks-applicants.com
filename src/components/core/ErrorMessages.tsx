import { changeFirstCharToUpper } from "@/lib/helpers/changeFirstCharToUpper";
import { Typography } from "@mui/material";

interface errorMessagesTypes {
  message: string;
  key: string;
}
const ErrorMessages = ({
  errorMessages,
  keyname,
}: {
  errorMessages: errorMessagesTypes[];
  keyname: string;
}) => {
  return (
    <p className="text-xs 3xl:!text-sm"
      style={{
        display: errorMessages?.length ? "block" : "none",
        color: "red",
        fontWeight: 400,
      }}
    >
      {changeFirstCharToUpper(
        errorMessages?.length
          ? errorMessages?.find((error) => error.key === keyname)?.message
          : ""
      )}
    </p>
  );
};
export default ErrorMessages;
