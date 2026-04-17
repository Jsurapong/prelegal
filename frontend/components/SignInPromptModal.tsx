"use client";

import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInPromptModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-[#032147]/10 p-8 max-w-sm mx-4 animate-fade-in-up">
        <h2 className="font-serif text-xl text-[#032147] mb-2">
          Save your progress
        </h2>
        <p className="text-sm font-sans text-[#888888] mb-6">
          Sign in to automatically save your documents and access them anytime.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block text-center bg-[#753991] text-white font-sans font-semibold text-sm py-3 rounded-lg hover:bg-[#5e2c75] transition-colors"
          >
            Sign In
          </Link>
          <button
            onClick={onClose}
            className="text-sm font-sans text-[#888888] hover:text-[#032147] transition-colors py-2"
          >
            Continue without saving
          </button>
        </div>
      </div>
    </div>
  );
}
