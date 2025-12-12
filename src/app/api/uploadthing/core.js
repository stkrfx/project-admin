import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import connectDB from "@/lib/db";
import User from "@/models/User";

const f = createUploadthing();

/* ---------------------------------------------------------
 * AUTH MIDDLEWARE — now fully secure
 * --------------------------------------------------------- */
const handleAuth = async () => {
  const session = await getServerSession(authOptions);

  // 1) Must have valid session
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // 2) Validate user against DB (prevents abuse)
  await connectDB();
  const user = await User.findById(session.user.id).select("isVerified isBanned");

  if (!user || user.isBanned || !user.isVerified) {
    throw new Error("Unauthorized: Account not allowed to upload files.");
  }

  return { userId: session.user.id };
};

/* ---------------------------------------------------------
 * UPLOAD ROUTERS
 * --------------------------------------------------------- */
export const ourFileRouter = {
  /* -------------------------------------------
   * 1. Profile Picture Upload
   * ------------------------------------------- */
  profilePicture: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Profile Pic Uploaded by:",
        metadata.userId,
        "URL:",
        file.url
      );

      return {
        uploadedBy: metadata.userId,
        url: file.url,
      };
    }),

  /* -------------------------------------------
   * 2. Expert Document Upload (PDF + Images)
   * ------------------------------------------- */
  expertDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Document Uploaded by:",
        metadata.userId,
        "URL:",
        file.url
      );

      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
      };
    }),
};
