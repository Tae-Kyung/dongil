"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Upload, Table2, Home, LogOut, User, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navigation = [
  { name: '홈', href: '/', icon: Home },
  { name: '대시보드', href: '/dashboard', icon: BarChart3 },
  { name: '다차원 분석', href: '/analysis', icon: PieChart },
  { name: '데이터 그리드', href: '/data', icon: Table2 },
  { name: '데이터 임포트', href: '/import', icon: Upload },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  // 로그인 페이지에서는 네비게이션 숨김
  if (pathname === '/login') {
    return null;
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">동일유리 분석시스템</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(user.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        <User className="mr-2 h-4 w-4" />
                        {user.email}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link href="/login">로그인</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
