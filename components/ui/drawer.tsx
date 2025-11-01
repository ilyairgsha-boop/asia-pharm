"use client";

import * as React from "react";
import { cn } from "./utils";

// Simple drawer implementation without vaul dependency
// This is a placeholder since drawer is not currently used in the application

function Drawer({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer" {...props}>{children}</div>;
}

function DrawerTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return <button data-slot="drawer-trigger" {...props}>{children}</button>;
}

function DrawerPortal({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-portal" {...props}>{children}</div>;
}

function DrawerClose({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return <button data-slot="drawer-close" {...props}>{children}</button>;
}

function DrawerOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <div
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "bottom-0 inset-x-0 mt-24 max-h-[80vh] rounded-t-lg border-t",
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full" />
        {children}
      </div>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
