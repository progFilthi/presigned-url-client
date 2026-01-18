"use client"

import { useState, useRef } from "react"
import { Upload, FileAudio, X, CheckCircle, AlertCircle } from "lucide-react"
import axios from "axios"
import { cn } from "@/lib/utils"

interface AudioUploadProps {
    onUploadComplete?: (url: string) => void
}

export function AudioUpload({ onUploadComplete }: AudioUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (file: File) => {
        if (!file.type.startsWith("audio/")) {
            setErrorMessage("Please select an audio file")
            setStatus("error")
            return
        }
        setFile(file)
        setErrorMessage("")
        setStatus("idle")
        setProgress(0)
    }

    const removeFile = () => {
        setFile(null)
        setStatus("idle")
        setProgress(0)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const uploadFile = async () => {
        if (!file) return

        setUploading(true)
        setProgress(10)
        setStatus("idle")

        try {
            // 1. Get Presigned URL
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
            const presignedRes = await axios.post(`${apiUrl}/api/s3/presigned-upload-url`, {
                fileName: file.name,
                contentType: file.type
            })
            const { uploadUrl } = presignedRes.data

            setProgress(40)

            // 2. Upload to S3
            await axios.put(uploadUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size))
                    setProgress(percentCompleted)
                }
            })

            setProgress(100)
            setStatus("success")

            if (onUploadComplete) {
                // The URL is the presigned URL w/o query params, or we can construct it if we know the bucket/key.
                // For now, let's just use the clean URL (removing query params) if possible, or just the file name.
                const cleanUrl = uploadUrl.split('?')[0];
                onUploadComplete(cleanUrl)
            }

        } catch (error) {
            console.error(error)
            setStatus("error")
            setErrorMessage("Upload failed. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-6">
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out text-center cursor-pointer overflow-hidden",
                    dragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-border bg-card hover:bg-card/80",
                    status === "error" && "border-destructive/50 bg-destructive/5",
                    file ? "border-primary/50" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={handleChange}
                />

                {!file ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-primary/20 text-primary animate-pulse-slow">
                            <Upload className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-foreground">
                                Drop your audio here
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                or click to browse
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <FileAudio className="w-8 h-8" />
                        </div>
                        <div className="w-full">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px] mx-auto">
                                {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>

                        {!uploading && status !== "success" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile()
                                }}
                                className="absolute -top-6 -right-6 p-2 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Progress Bar Background */}
                {file && (
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                )}
            </div>

            {/* Error Message */}
            {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-destructive justify-center animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Action Button */}
            {file && status !== "success" && (
                <button
                    onClick={uploadFile}
                    disabled={uploading}
                    className={cn(
                        "w-full mt-6 py-3 px-4 rounded-lg font-medium transition-all duration-200",
                        uploading
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
                    )}
                >
                    {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Uploading...
                        </span>
                    ) : (
                        "Upload Audio"
                    )}
                </button>
            )}

            {/* Success State */}
            {status === "success" && (
                <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in zoom-in">
                    <div className="flex items-center gap-2 text-green-500 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span>Upload Complete!</span>
                    </div>
                    <button
                        onClick={removeFile}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors underline decoration-dotted"
                    >
                        Upload another file
                    </button>
                </div>
            )}
        </div>
    )
}
