import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, number>;
  formatPrice: (priceInINR: number) => string;
  convertPrice: (priceInINR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  setCurrency: () => {},
  rates: { INR: 1, USD: 0.012, EUR: 0.011 },
  formatPrice: (p) => `₹${p}`,
  convertPrice: (p) => p,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState('INR');
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1, USD: 0.012, EUR: 0.011 });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // In a real app, use a real API key and endpoint
        // For demo, we use static rates or a free API if available
        // const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
        // setRates(response.data.rates);
      } catch (error) {
        console.error('Failed to fetch exchange rates', error);
      }
    };
    fetchRates();
  }, []);

  const convertPrice = (priceInINR: number) => {
    const rate = rates[currency] || 1;
    return priceInINR * rate;
  };

  const formatPrice = (priceInINR: number) => {
    const converted = convertPrice(priceInINR);
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';
    return `${symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
