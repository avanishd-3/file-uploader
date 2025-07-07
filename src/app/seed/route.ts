import { seedDatabase } from "@/lib/seed";

export async function GET() {
    try {
        await seedDatabase();
        return new Response("Database seeded successfully", { status: 200 });
    } catch (error) {
        console.error("Error seeding database:", error);
        return new Response("Failed to seed database", { status: 500 });
    }
}