import { Stethoscope } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-16 max-w-7xl items-center px-4 md:px-6">
        <div className="mr-4 flex items-center">
          <Stethoscope className="h-7 w-7 mr-3 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">RadioAgent</h1>
        </div>
      </div>
    </header>
  );
}
