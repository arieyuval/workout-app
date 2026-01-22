import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-4 px-6 border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-4xl mx-auto flex justify-center gap-4 text-xs text-zinc-500">
        <a
          href="https://www.freeprivacypolicy.com/live/e6964847-38bb-483c-8865-6c6685ac96b4"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-300 transition-colors"
        >
          Privacy Policy
        </a>
        <span>•</span>
        <Link href="/delete-data" className="hover:text-zinc-300 transition-colors">
          Delete My Data
        </Link>
      </div>
    </footer>
  );
}
