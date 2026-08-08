import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import busboy from "busboy";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check for missing config
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "Cloudinary is not configured" },
        { status: 500 }
      );
    }

    // Convert headers to plain object for busboy
    const headers = Object.fromEntries(request.headers.entries());

    // Use busboy to parse the multipart/form-data
    const bb = busboy({ headers });

    // Create a promise that resolves when the file is uploaded
    const uploadResult = await new Promise((resolve, reject) => {
      let fileBuffer: Buffer | null = null;

      bb.on("file", (name, file, info) => {
        const chunks: Buffer[] = [];
        file.on("data", (data: Buffer) => chunks.push(data));
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on("finish", () => {
        if (!fileBuffer) {
          reject(new Error("No file uploaded"));
          return;
        }

        // Upload to Cloudinary
        cloudinary.uploader
          .upload_stream(
            {
              folder: "unistay/listings",
              upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(result);
            }
          )
          .end(fileBuffer);
      });

      bb.on("error", reject);

      // Pipe the request body to busboy
      const readable = request.body as ReadableStream;
      const reader = readable.getReader();
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) {
            bb.end();
            return;
          }
          bb.write(value);
          return pump();
        });
      pump().catch(reject);
    });

    const secureUrl = (uploadResult as any).secure_url;

    return NextResponse.json({ url: secureUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}