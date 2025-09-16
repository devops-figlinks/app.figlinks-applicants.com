import { changeFirstCharToUpper } from "@/lib/helpers/changeFirstCharToUpper";

export const getTheNameFromDataObj = ({ fname = "", mname = "", lname = "" } = {}) =>
  [fname, mname, lname].filter(Boolean).map(changeFirstCharToUpper).join(" ");
