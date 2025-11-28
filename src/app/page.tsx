import Link from "next/link";
import { Button } from "@/components/ui/button";
import TypingText from "@/components/ui/typewriter-text";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tl from-[#0e7490] via-[#3b82f6] to-[#4f46e5] text-white">
      {/* TypeWriter Effect b/c it looks cool */}
      {/* API Reference: https://www.shadcn.io/text/typing-text#api-reference */}
      <div className="flex items-center justify-center mb-2">
        <TypingText
         text={["File Upload", "Amazing Previews"]}
         typingSpeed={100} // ms per character
         pauseDuration={1000} // ms before erasing
         loop={true}
         as={"div"} // Render as div
         showCursor={true}
         className="text-4xl font-bold text-center max-w-2xl"
         cursorClassName="h-12"
         variableSpeed={{ min: 50, max: 75}} // Makes text feel more natural
         deletingSpeed={80} // ms per character when deleting (should be less than when typing to feel more natural)
        />
      </div>
  
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
