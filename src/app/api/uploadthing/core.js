import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

// Auth Middleware: Ensures only logged-in experts can upload
const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  
  // Return the user ID so we know who uploaded it
  return { userId: session.user.id };
};

export const ourFileRouter = {
  // 1. Profile Picture Uploader
  profilePicture: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 } 
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile Pic Uploaded by:", metadata.userId, "URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // 2. Document Uploader (License/Certs) - Supports PDF & Images
  expertDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document Uploaded by:", metadata.userId, "URL:", file.url);
      return { 
        uploadedBy: metadata.userId, 
        url: file.url,
        name: file.name 
      };
    }),
};