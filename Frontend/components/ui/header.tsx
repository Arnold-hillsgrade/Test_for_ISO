"use client";

import { useAppContext } from "@/app/context";
import { isTokenValid } from "@/app/utils/cookies";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "@/app/utils/axiosConfig";

export function Header() {
  const router = useRouter();
  const { user, setUser, setWorkspaces } = useAppContext();

  useEffect(() => {
    const abortController = new AbortController();

    const checkToken = async () => {
      try {
        const valid = await isTokenValid(abortController.signal);

        if (!abortController.signal.aborted)
          if (valid.status === 200) {
            setUser(valid.data.user);
          } else {
            setUser({
              id: "",
              name: "",
              email: "",
              avatar: "",
              role: "isoplus_user"
            });
            setWorkspaces([]);
            router.push("/");
          }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Token verification failed:', error);
        }
      }
    };

    checkToken();

    return () => {
      abortController.abort();
    };
  }, [router]);

  const handleLogout = () => {
    axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {})
      .then(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("workspace");
        localStorage.removeItem("board");
        setUser({
          id: "",
          name: "",
          email: "",
          avatar: "",
          role: "isoplus_user"
        });
        setWorkspaces([]);
        router.push("/");
      })
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <span className="text-lg font-semibold">ISO+™ Portal</span>

        <div className="flex items-center justify-center cursor-pointer" onClick={() => { window.location.href = "https://app.isoplus.online/home"; }}>
          <img
            src="/assets/logo_rgb_black.png"
            alt="ISO+ Logo"
            className="h-8 dark:hidden"
          />
          <img
            src="/assets/logo_rgb_white.png"
            alt="ISO+ Logo"
            className="h-8 hidden dark:block"
          />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.avatar ? <img src={`${user.avatar}`} alt="" width={100} height={100} /> : user.name && user.name.trim() !== ''
                ? user.name.split(' ').map(n => n[0]).join('')
                : 'N/A'}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}