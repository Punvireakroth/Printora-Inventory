import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md text-center space-y-2">
        <p className="text-sm text-muted-foreground font-mono">
          Printora Inventory
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Foundation scaffold ready
        </h1>
        <p className="text-muted-foreground text-sm">
          Next.js 15 · Supabase clients · next-intl · shadcn/ui · Outfit +
          Kantumruy Pro
        </p>
        <p className="text-sm" lang="km">
          អត្ថបទគំរូសម្រាប់ពិនិត្យពុម្ពអក្សរខ្មែរ
        </p>
      </div>
      <Button type="button">Shadcn button</Button>
    </div>
  );
}
