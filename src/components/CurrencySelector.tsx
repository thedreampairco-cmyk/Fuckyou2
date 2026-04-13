import React from 'react';
import { useCurrency } from '@/lib/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  const currencies = [
    { code: 'INR', label: 'INR (₹)', flag: '🇮🇳' },
    { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
    { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'rounded-full gap-2 border-slate-200'
        )}
      >
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="font-bold text-xs">{currency}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="gap-2 cursor-pointer"
          >
            <span>{c.flag}</span>
            <span className={currency === c.code ? 'font-bold text-primary' : ''}>
              {c.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
