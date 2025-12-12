import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import connectDB from "@/lib/db";
import User from "@/models/User";

const f = createUploadthing();

/* ---------------------------------------------------------
 * AUTH MIDDLEWARE — Now Safe & UploadThing-Compatible
 * --------------------------------------------------------- */
const handleAuth = async () => {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("isVerified isBanned");

    if (!user || user.isBanned || !user.isVerified) {
      throw new Error("Unauthorized: Account restricted");
    }

    return { userId: session.user.id };

  } catch (error) {
    // ⭐ CRITICAL FIX — Prevent UploadThing Thread Crash
    console.error("UploadThing Auth Failed:", error.message);

    // ❗ MUST rethrow for UploadThing to gracefully respond with 403
    throw new Error(error.message);
  }
};


/* ---------------------------------------------------------
 * UPLOAD ROUTERS
 * --------------------------------------------------------- */
export const ourFileRouter = {
  profilePicture: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Uploaded by:", metadata.userId, "URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  expertDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document uploaded by:", metadata.userId, "URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url, name: file.name };
    }),
};
