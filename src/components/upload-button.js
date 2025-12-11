"use client";

import { generateUploadButton } from "@uploadthing/react";

// Generate the button using the router type (optional but good for TS)
// Since this is JS, we just generate it directly.
export const UploadButton = generateUploadButton();