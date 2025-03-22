import { SignedIn } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      className="min-h-screen bg-gradient-to-b from-white to-gray-50/50
      flex items-center justify-center"
    >
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right, #e5e5e5_1px, transparent_1px),
       linear-gradient(to_bottom, #e5e5e5_1px, transparent_1px)] bg-[size:6rem_6rem]"
      ></div>
      <section className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-col items-center space-y-10 text-center">
        <header className="space-y-16">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-transparent bg-clip-text">
            AI Agent Assistant
          </h1>
          <p className="max-w-[600px] text-xl text-gray-600 md:text-xl/relaxed xl:text-2xl/relaxed">
            Meet your new AI chat companion that goes beyond conversation - it
            actually get things done!
            <br />
            <span className="text-gray-400 text-sm">
              Powered by IBM&apos;s WxTools & your Favorite LLM&apos;s
            </span>
          </p>
        </header>

        <SignedIn>
          <Link href="/dashboard">
            <button
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white 
              bg-gradient-to-r from-gray-900 to-gray-800 rounded-full hover:from-gray-800 hover:to-gray-700 transition-all duration-200
              shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5  transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 to-gray-800/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </Link>
        </SignedIn>
      </section>
    </main>
  );
}
