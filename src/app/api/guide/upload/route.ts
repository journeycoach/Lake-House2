import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

/*
  Photos are uploaded straight from the browser to Blob storage, because a
  photo off a phone is routinely larger than a server action is allowed to
  carry. This route only hands out a permission to upload, after checking the
  person is allowed to edit the guide.
*/
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getEffectiveUser();
        if (!user || !canEdit(user.effectiveRole)) {
          throw new Error("Not allowed to add photos.");
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/gif",
          ],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do: the block row is written by the form once the client
        // has the URL back.
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
