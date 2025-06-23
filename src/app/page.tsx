import Link from "next/link";
import TypeWriterHeader from "@/components/typewriter-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tl from-[#0e7490] via-[#3b82f6] to-[#4f46e5] text-white">
      {/* TypeWriter Effect b/c it looks cool */}
      <h1 className="text-4xl font-bold mb-2">
        <TypeWriterHeader />

      </h1>
      {/* Explanation of service */}
      <p className="text-2xl mb-5 max-w-120 text-center">
        Secure, private, and easy file upload service for your personal use.
      </p>

      {/* Sign in button */}
      <Button
        asChild // Apply the styles of the Button component to the Link
        size="lg" // Make larger so it better balances against the header and description
        className="bg-white text-blue-600 px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
      >
        {/* TODO -> Chaneg this to the actual sign-in page after implementing auth */}
        <Link href="/drive">Get Started</Link> 
      </Button>
      
    </main>
  );
}
