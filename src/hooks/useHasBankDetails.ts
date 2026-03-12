import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface BankAccount {
  _id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
}

interface ApiResponse {
  data?: BankAccount[];
}

export function useHasBankDetails() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: async () => {
      const res = await api.get<ApiResponse>("/bank-accounts");
      return (res.data as ApiResponse)?.data ?? [];
    },
  });

  const hasBankDetails = Array.isArray(data) && data.length > 0;
  return { hasBankDetails, isLoading };
}
