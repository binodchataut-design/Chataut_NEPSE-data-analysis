import { normalizedCompanies } from '../data/normalizedMasterData';
export const companyRepository = {
  async getAllCompanies() { return normalizedCompanies; },
  async getCompanyBySymbol(symbol: string) { return normalizedCompanies.find(c => c.symbol === symbol) || null; }
};
