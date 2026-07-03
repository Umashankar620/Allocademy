import { type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <Card className={cn('w-full max-w-md shadow-lg', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
