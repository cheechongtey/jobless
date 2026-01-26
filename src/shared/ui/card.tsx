import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export function Card(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="card"
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      {...rest}
    />
  );
}

export function CardHeader(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props;
  return <div data-slot="card-header" className={cn('flex flex-col space-y-1.5 p-6', className)} {...rest} />;
}

export function CardTitle(props: React.ComponentProps<'h3'>) {
  const { className, ...rest } = props;
  return <h3 data-slot="card-title" className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...rest} />;
}

export function CardDescription(props: React.ComponentProps<'p'>) {
  const { className, ...rest } = props;
  return <p data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...rest} />;
}

export function CardContent(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props;
  return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...rest} />;
}

export function CardFooter(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props;
  return <div data-slot="card-footer" className={cn('flex items-center p-6 pt-0', className)} {...rest} />;
}
