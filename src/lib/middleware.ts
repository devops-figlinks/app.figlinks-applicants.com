import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = ["/interviews", "/company-details",];

const unProtectedRoutes = [
  "/",
  "/sign-up",
  "/sign-up/verify",
  "/forgot-password",
  "/forgot-password/verify",

];
const superAdminRoutes = ["/admin"];
function containsSubstring(inputString: string, substrings: Array<string>) {
  return substrings.some((substring) => inputString.includes(substring));
}

const isAuthenticated = (req: NextRequest) => {
  const loggedIn = req.cookies.get("token");
  if (loggedIn) return true;
  return false;
};
const getUserType = (req: NextRequest) => {
  const userTypeCookie = req.cookies.get("user_type");

  return userTypeCookie ? userTypeCookie?.value : null;
};

export default function middleware(req: NextRequest) {
  const userType = getUserType(req);



  if (
    !isAuthenticated(req) &&
    (containsSubstring(req.nextUrl.pathname, protectedRoutes) || containsSubstring(req.nextUrl.pathname, superAdminRoutes))
  ) {


    const absoluteURL = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  if (
    isAuthenticated(req) &&
    unProtectedRoutes.includes(req.nextUrl.pathname)
  ) {
    const absoluteURL = new URL("/all-interviews", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }


  if (isAuthenticated(req) && userType === "SUPER_ADMIN" && (req.nextUrl.pathname == "/all-interviews" || req.nextUrl.pathname == "/all-candidates" || req.nextUrl.pathname == "add-recipients")) {


    const absoluteURL = new URL("/admin", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
  if (isAuthenticated(req) && userType === "SUPER_ADMIN" && (req.nextUrl.pathname == "/")) {
    const absoluteURL = new URL("/admin", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }



  if (
    isAuthenticated(req) &&
    userType !== "SUPER_ADMIN" &&
    containsSubstring(req.nextUrl.pathname, superAdminRoutes)
  ) {


    const absoluteURL = new URL("/all-interviews", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }


}
