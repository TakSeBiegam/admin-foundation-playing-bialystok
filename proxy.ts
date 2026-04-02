import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/partners/:path*",
    "/offer/:path*",
    "/messages/:path*",
    "/users/:path*",
  ],
};