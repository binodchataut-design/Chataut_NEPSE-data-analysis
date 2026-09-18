import { normalizedCompanies } from '../data/normalizedMasterData';
import { providerRegistry } from '../providers/providerRegistry';
import { CompanyMaster } from '../types/dataInfrastructure';

export const companyRepository = {
  async getAllCompanies(): Promise<CompanyMaster[]> {
    const mode = providerRegistry.getMode();
    if (mode === 'SUPABASE' || mode === 'REAL_DATA') {
      return providerRegistry.getStockProvider().fetchCompanies();
    }
    return normalizedCompanies;
  },
  async getCompanyBySymbol(symbol: string): Promise<CompanyMaster | null> {
    const companies = await this.getAllCompanies();
    return companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()) || null;
  }
};

