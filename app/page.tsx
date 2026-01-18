"use client"

import { AudioUpload } from "@/components/ui/file-upload"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl opacity-50" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center gap-8 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Audio Stream
          </h1>
          <p className="text-lg text-muted-foreground max-w-[600px]">
            Upload your high-fidelity audio tracks directly to our secure cloud storage.
          </p>
        </div>

        <div className="w-full p-8 rounded-2xl bg-card border border-border/50 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <AudioUpload />
        </div>

        <footer className="text-xs text-muted-foreground/50 mt-12">
          Powered by Next.js & S3 Presigned URLs
        </footer>
      </div>
    </main>
  )
}
