"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("game_settings")
        .select("setting_value")
        .eq("setting_key", "admin_password")
        .single();

      if (error) throw error;

      if (data.setting_value === password) {
        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin_auth_time", Date.now().toString());
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      toast.error("Failed to verify password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">ADMIN LOGIN</h1>
            <p className="text-gray-500 text-sm">
              Enter the admin password to continue
            </p>
          </div>

          <div className="espn-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="espn-input w-full"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#d00] text-white font-semibold rounded-lg hover:bg-[#b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? "Verifying..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
