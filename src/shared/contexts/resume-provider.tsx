'use client';

import { ResumeSidebar } from '@/pages-layer/application/ui/resume-sidebar/resume-sidebar';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '../ui/breadcrumb';
import { Separator } from '../ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';

type AppProviderProps = {
  children: React.ReactNode;
};

export const ResumeProvider = ({ children }: AppProviderProps) => {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '19rem',
        } as React.CSSProperties
      }
    >
      <ResumeSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto" />
          <ThemeToggle />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
