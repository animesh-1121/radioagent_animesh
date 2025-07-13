import { Header } from '@/components/layout/header';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  );
}
