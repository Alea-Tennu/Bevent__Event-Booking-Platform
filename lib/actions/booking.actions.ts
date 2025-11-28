'use server'


import { Booking } from "@/database"
import connectDB from "../mongodb"

export const createBooking = async ({slug, email, eventId} : {slug:string, email:string, eventId: string}) => {
    try {
    await connectDB()
    await Booking.create({slug, email, eventId})
    return {
        success: true,
        // booking: JSON.stringify(booking),
    }
} catch (error) {
    console.error("Create booking failed ", error)
    return {sucess: false}
}}