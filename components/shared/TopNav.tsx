"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ProfileDialog } from "@/components/shared/ProfileDialog";
import { getInitials } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { SessionUser } from "@/types";

interface Props {
  user: SessionUser;
  notificationsPath: string;
}

export function TopNav({ user, notificationsPath }: Props) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        <NotificationBell notificationsPath={notificationsPath} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ProfileDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile Picture
                </DropdownMenuItem>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
