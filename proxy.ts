import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activity-log/:path*",
    "/events/:path*",
    "/partners/:path*",
    "/catalog/:path*",
    "/gallery/:path*",
    "/messages/:path*",
    "/permissions/:path*",
    "/users/:path*",
  ],
};
