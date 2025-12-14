/*
 * File: src/app/api/uploadthing/core.js
 * ROLE: UploadThing Router (Profile, Documents, Chat Attachments)
 * SAFE: NextAuth + DB validation + UploadThing compatible
 */

import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import connectDB from "@/lib/db";
import User from "@/models/User";

const f = createUploadthing();

/* ---------------------------------------------------------
 * AUTH MIDDLEWARE
 * --------------------------------------------------------- */
const handleAuth = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("isVerified isBanned")
      .lean();

    if (!user || user.isBanned || !user.isVerified) {
      throw new Error("Unauthorized: Account restricted");
    }

    // ⚠️ IMPORTANT: must return serializable metadata
    return { userId: session.user.id };
  } catch (error) {
    // ⭐ CRITICAL: must throw to let UploadThing respond with 403
    console.error("UploadThing Auth Failed:", error.message);
    throw new Error(error.message);
  }
};

/* ---------------------------------------------------------
 * FILE ROUTERS
 * --------------------------------------------------------- */
export const ourFileRouter = {
  /* -------------------------
   * Profile Picture Upload
   * ------------------------- */
  profilePicture: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.url,
      };
    }),

  /* -------------------------
   * Expert Documents
   * ------------------------- */
  expertDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        type: file.type,
      };
    }),

  /* -------------------------
   * ✅ Chat Attachments
   * Used by ChatClient
   * ------------------------- */
  chatAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 }, // voice notes
    blob: { maxFileSize: "16MB", maxFileCount: 1 },  // fallback for MediaRecorder
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        type: file.type,
        name: file.name,
      };
    }),
};
