import { CompanyMaster, SectorMaster } from '../types/dataInfrastructure';
import { providerRegistry } from '../providers/providerRegistry';
import { normalizedCompanies, normalizedSectors } from '../data/normalizedMasterData';

export class CompanyRepository {
  public async getAllCompanies(): Promise<CompanyMaster[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      return [...normalizedCompanies];
    }
    // Live mode: call live provider. Never silently substitute mock data.
    const provider = providerRegistry.getStockProvider();
    return provider.fetchCompanies();
  }

  public async getCompanyBySymbol(symbol: string): Promise<CompanyMaster | null> {
    const all = await this.getAllCompanies();
    const found = all.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    return found || null;
  }

  public async getCompanyById(id: string): Promise<CompanyMaster | null> {
    const all = await this.getAllCompanies();
    const found = all.find(c => c.id === id);
    return found || null;
  }

  public async getAllSectors(): Promise<SectorMaster[]> {
    return [...normalizedSectors];
  }

  public async getCompaniesBySector(sectorId: string): Promise<CompanyMaster[]> {
    const all = await this.getAllCompanies();
    return all.filter(c => c.sector_id === sectorId);
  }
}

export const companyRepository = new CompanyRepository();
