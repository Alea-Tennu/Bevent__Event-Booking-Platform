import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        await connectToDatabase();

        const formData = await req.formData();
        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (error) {
            return NextResponse.json(
                {
                    message: "Invalid JSON data farmat",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                { status: 400 }
            );
        }

        const file = formData.get("image");
        if (!(file instanceof File)) {
            return new NextResponse(JSON.stringify({ message: "Image file is required" }), { status: 400 });
        }

        const tags = JSON.parse(formData.get('tags') as string)
        const agenda = JSON.parse(formData.get('agenda') as string)

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResults = await new Promise<UploadApiResponse>((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        resource_type: "image",
                        folder: "DevEvent",
                    },
                    (error, results) => {
                        if (error) {
                            return reject(error);
                        }
                        if (!results) {
                            return reject(new Error("Image upload failed: empty response from Cloudinary"));
                        }
                        resolve(results);
                    }
                )
                .end(buffer);
        });

        event.image = uploadResults.secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags:tags,
            agenda:agenda
        });

        return NextResponse.json(
            { success: true, message: "Event created successfully", event: createdEvent },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false, 
                message: "Event creation failed", 
                error: error instanceof Error ? error.message : "Unknown error"
            },
            {
                status: 500
            }
        )
    }
}

export const GET = async () => {
    try {
        await connectToDatabase();

        const events = await Event.find({}).sort({ createdAt: -1 });

        return NextResponse.json(
            { success: true, message: "Events fetched successfully", events },
            { status: 200 }
        );
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          message: "Error fetching events",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500 }
      );
    }
}
