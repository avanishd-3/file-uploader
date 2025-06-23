"use client"; // Need to do this or will get TypeError: Super expression must either be null or a function

import Typewriter from "typewriter-effect";

export default function TypewriterHeader() {
    return (
        <Typewriter
          options={{
            strings: ['File Upload'],
            autoStart: true,
            loop: false, // Only want the effect to run once, otherwise it looks annoying
            deleteSpeed: Infinity, // Prevents deletion of the text
            delay: 75,
          }}
          />
    )
}
