"use client";

import Link from 'next/link';
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function DeleteDataPage() {
  const { user, session, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDeleteRequest = async () => {
    if (confirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    if (!user || !session?.access_token) {
      setMessage({ type: "error", text: "You must be logged in to delete your data" });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      // Use Supabase client to invoke the Edge Function (handles auth automatically)
      const supabase = createBrowserSupabaseClient();

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          'x-user-token': session.access_token,
        },
      });

      if (error) {
        console.error('Delete account error:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: "success",
        text: "Your account and all data have been permanently deleted. Redirecting..."
      });
      setConfirmText("");

      // Sign out and redirect after a short delay
      setTimeout(async () => {
        await signOut();
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred while deleting your account. Please try again or contact support."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Delete Your Account</h1>

        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Warning</h2>
          <p className="text-zinc-300 mb-4">
            This action will permanently delete your account and all data from Plates, including:
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-4 space-y-1">
            <li>Your account and login credentials</li>
            <li>All workout history</li>
            <li>All exercises you&apos;ve created</li>
            <li>All sets and reps logged</li>
            <li>All body weight records</li>
            <li>Your profile information</li>
          </ul>
          <p className="text-zinc-300 font-medium">
            This action cannot be undone. You will need to create a new account to use Plates again.
          </p>
        </div>

        {!user ? (
          <div className="bg-zinc-900 rounded-lg p-6">
            <p className="text-zinc-300">
              Please <a href="/login" className="text-cyan-400 hover:underline">log in</a> to delete your data.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-lg p-6">
            <label className="block text-sm text-zinc-400 mb-2">
              Type <span className="font-mono font-bold text-white">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-red-500"
              placeholder="DELETE"
            />

            <button
              onClick={handleDeleteRequest}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete My Account"}
            </button>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-900/50 text-green-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        )}
        <div className="mt-6 text-center">
        <Link href="/" className="text-cyan-400 hover:underline text-sm">
          ← Back to Home
        </Link>
      </div>
      </div>
    </div>
  );
}
