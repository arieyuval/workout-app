"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function DeleteDataPage() {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDeleteRequest = async () => {
    if (confirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to delete your data" });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      // Delete user's sets
      const { error: setsError } = await supabase
        .from("sets")
        .delete()
        .eq("user_id", user.id);

      if (setsError) throw setsError;

      // Delete user's exercises
      const { error: exercisesError } = await supabase
        .from("exercises")
        .delete()
        .eq("user_id", user.id);

      if (exercisesError) throw exercisesError;

      // Delete user's weight logs
      const { error: weightError } = await supabase
        .from("weight_logs")
        .delete()
        .eq("user_id", user.id);

      if (weightError) throw weightError;

      // Delete user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      setMessage({
        type: "success",
        text: "Your data has been deleted. You can now sign out or continue using the app with a fresh start."
      });
      setConfirmText("");
    } catch (error) {
      console.error("Error deleting data:", error);
      setMessage({
        type: "error",
        text: "An error occurred while deleting your data. Please try again or contact support."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Delete Your Data</h1>

        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Warning</h2>
          <p className="text-zinc-300 mb-4">
            This action will permanently delete all your data from Plates, including:
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-4 space-y-1">
            <li>All workout history</li>
            <li>All exercises you&apos;ve created</li>
            <li>All sets and reps logged</li>
            <li>All body weight records</li>
            <li>Your profile information</li>
          </ul>
          <p className="text-zinc-300 font-medium">
            This action cannot be undone.
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
              {isDeleting ? "Deleting..." : "Permanently Delete My Data"}
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
          <a href="/" className="text-cyan-400 hover:underline text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
